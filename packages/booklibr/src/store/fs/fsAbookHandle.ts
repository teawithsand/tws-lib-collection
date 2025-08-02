import {
	FsDirHandle,
	FsFileHandle,
	FsHandleType,
	Path,
} from "@teawithsand/fstate"
import { Blobs, generateUuid, Timestamp } from "@teawithsand/lngext"
import {
	Abook,
	AbookAggregateData,
	AbookEntry,
	AbookEntryData,
	AbookHeaderData,
} from "../../defines"
import {
	AbookEntryHandle,
	AbookError,
	AbookHandle,
	AbookNotFoundError,
	AbookWriteHeaderOptions,
} from "../defines"
import { AbookWriteAggregateType } from "../defines/aggregate"
import {
	createEntryDataPath,
	FS_STORE_ENTRIES_DIR,
	FS_STORE_ENTRY_BLOB_EXTENSION,
	FS_STORE_ENTRY_DATA_EXTENSION,
	FS_STORE_HEADER_FILE,
} from "./constants"
import { FsAbookEntryHandle } from "./fsAbookEntryHandle"
import {
	FsAbookStoreAbookData,
	FsAbookStoreAbookEntryData,
	FsAbookStoreConfig,
} from "./store"

/**
 * Internal file system implementation of audiobook operations.
 * This class requires an existing abookRoot directory.
 */
class FsAbookHandleImpl {
	private headerFile: FsFileHandle | null = null
	private entriesDir: FsDirHandle | null = null

	constructor(
		private readonly config: FsAbookStoreConfig,
		private readonly abookRoot: FsDirHandle,
	) {}

	public get id() {
		return this.abookRoot.name
	}

	/**
	 * Checks if the audiobook exists in the file system.
	 */
	public readonly exists = async (): Promise<boolean> => {
		return this.abookRoot.exists()
	}

	/**
	 * Reads the audiobook from the file system.
	 * Returns null if the audiobook doesn't exist.
	 */
	public readonly read = async (): Promise<Abook | null> => {
		try {
			const data = await this.readAbookData()
			if (!data) return null
			const entries = await this.readAbookEntries()

			// Create entry handles and read the actual entry data
			const entryMap = new Map<string, AbookEntry>()
			for (const id of entries) {
				const entryHandle = this.createEntryHandle(id)
				const entryData = await entryHandle.read()
				if (entryData) {
					entryMap.set(id, entryData)
				}
			}

			return new Abook({
				aggregate: data.aggregate,
				data: {
					header: data.header,
					entries: entryMap,
				},
			})
		} catch (e) {
			throw new AbookError(`Failed to read Abook with id ${this.id}`, e)
		}
	}

	/**
	 * Reads the audiobook from the file system.
	 * Throws an error if the audiobook doesn't exist.
	 */
	public readonly mustRead = async (): Promise<Abook> => {
		const abook = await this.read()
		if (!abook) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return abook
	}

	/**
	 * Writes audiobook header data to the file system.
	 * Handles aggregation based on provided options.
	 */
	public readonly write = async (
		options: AbookWriteHeaderOptions,
	): Promise<void> => {
		const existingData = await this.readAbookData()
		if (!existingData) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}

		const headerData = this.resolveHeaderData(options, existingData)
		const aggregate = await this.resolveAggregateData(
			options,
			existingData,
			headerData,
		)

		const dataToSave: FsAbookStoreAbookData = {
			header: headerData,
			aggregate: aggregate ?? this.createDefaultAggregate(),
		}

		await this.saveAbookData(dataToSave)
	}

	/**
	 * Internal write method used during creation that bypasses existence checks.
	 */
	public readonly writeForCreation = async (
		options: AbookWriteHeaderOptions,
	): Promise<void> => {
		const existingData = await this.readAbookData()
		const headerData = this.resolveHeaderData(options, existingData)
		const aggregate = await this.resolveAggregateData(
			options,
			existingData,
			headerData,
		)

		const dataToSave: FsAbookStoreAbookData = {
			header: headerData,
			aggregate: aggregate ?? this.createDefaultAggregate(),
		}

		await this.saveAbookData(dataToSave)
	}

	/**
	 * Creates a new entry in the audiobook.
	 */
	public readonly createEntry = async (
		data: AbookEntryData,
	): Promise<AbookEntryHandle> => {
		const id = generateUuid()
		const entriesDir = await this.getOrCreateEntriesDir()

		const entryData: FsAbookStoreAbookEntryData = {
			data: data,
			aggregate: {
				metadata: null,
				blobSize: null,
			},
		}

		const entryFile = await entriesDir.openFile(createEntryDataPath(id), {
			create: true,
			allowExisting: false,
		})

		const serialized = this.config.abookEntrySerializer.serialize(entryData)
		const writer = await entryFile.write()
		await writer.write(serialized)
		await writer.close()

		return this.createEntryHandle(id)
	}

	/**
	 * Lists all entries in the audiobook.
	 */
	public readonly listEntries = async (): Promise<AbookEntryHandle[]> => {
		const entriesDir = await this.getOrCreateEntriesDir()
		const stat = await entriesDir.stat()
		const entries = stat.entries

		return entries
			.filter(
				(entry) =>
					entry.type === FsHandleType.FILE &&
					!entry.name.endsWith(FS_STORE_ENTRY_BLOB_EXTENSION),
			)
			.map((entry) => {
				const entryId = entry.name.replace(
					FS_STORE_ENTRY_DATA_EXTENSION,
					"",
				)
				return this.createEntryHandle(entryId)
			})
	}

	/**
	 * Deletes the audiobook and all its entries from the file system.
	 */
	public readonly delete = async (): Promise<void> => {
		await this.abookRoot.delete(true)
	}

	/**
	 * Computes and updates the audiobook's aggregate data.
	 */
	public readonly computeAggregate = async (): Promise<void> => {
		const existingData = await this.readAbookData()
		const richAbook = await this.read()
		if (!richAbook) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}

		const newAggregate = await this.config.abookAggregator.aggregate(
			richAbook.data,
		)

		const dataToSave: FsAbookStoreAbookData = {
			header: existingData?.header ?? this.createDefaultHeaderData(),
			aggregate: newAggregate,
		}

		await this.saveAbookData(dataToSave)
	}

	/**
	 * Gets or creates the entries directory for this audiobook.
	 * This method is used by FsAbookEntryHandle to access the entries directory.
	 */
	public readonly getOrCreateEntriesDir = async (): Promise<FsDirHandle> => {
		if (!this.entriesDir) {
			this.entriesDir = await this.abookRoot.openDir(
				FS_STORE_ENTRIES_DIR,
				{
					create: true,
				},
			)
		}
		return this.entriesDir
	}

	/**
	 * Creates an entry handle without circular references.
	 * This method creates a proper handle interface that can access the parent abook.
	 */
	private readonly createEntryHandle = (id: string): AbookEntryHandle => {
		// Create a simplified interface for the entry handle
		const abookInterface = {
			id: this.id,
			exists: this.exists,
			read: this.read,
			mustRead: this.mustRead,
			write: this.write,
			createEntry: this.createEntry,
			listEntries: this.listEntries,
			delete: this.delete,
			computeAggregate: this.computeAggregate,
			getOrCreateEntriesDir: this.getOrCreateEntriesDir,
		}
		return new FsAbookEntryHandle(this.config, abookInterface, id)
	}

	// ...existing private methods remain the same...

	/**
	 * Resolves the header data based on options and existing data.
	 */
	private readonly resolveHeaderData = (
		options: AbookWriteHeaderOptions,
		existingData: FsAbookStoreAbookData | null,
	): AbookHeaderData => {
		return (
			options.data ??
			existingData?.header ??
			this.createDefaultHeaderData()
		)
	}

	/**
	 * Resolves the aggregate data based on options and existing data.
	 * Returns null if recomputation was triggered (method handles the save internally).
	 */
	private readonly resolveAggregateData = async (
		options: AbookWriteHeaderOptions,
		existingData: FsAbookStoreAbookData | null,
		headerData: AbookHeaderData,
	): Promise<AbookAggregateData | null> => {
		const aggregateOptions = options.aggregate

		if (aggregateOptions) {
			return await this.handleExplicitAggregateOptions(
				aggregateOptions,
				existingData,
			)
		}

		return await this.handleImplicitAggregateOptions(
			existingData,
			headerData,
		)
	}

	/**
	 * Handles explicit aggregate options from the write request.
	 */
	private readonly handleExplicitAggregateOptions = async (
		aggregateOptions: NonNullable<AbookWriteHeaderOptions["aggregate"]>,
		existingData: FsAbookStoreAbookData | null,
	): Promise<AbookAggregateData | null> => {
		switch (aggregateOptions.type) {
			case AbookWriteAggregateType.RECOMPUTE:
				await this.computeAggregate()
				return null // Indicates that computation was handled internally
			case AbookWriteAggregateType.CLEAR:
				return this.createClearedAggregate()
			case AbookWriteAggregateType.LEAVE_UNMODIFIED:
				return existingData?.aggregate ?? this.createDefaultAggregate()
			case AbookWriteAggregateType.SET:
				return aggregateOptions.data
		}
	}

	/**
	 * Handles implicit aggregate options when no explicit options are provided.
	 */
	private readonly handleImplicitAggregateOptions = async (
		existingData: FsAbookStoreAbookData | null,
		headerData: AbookHeaderData,
	): Promise<AbookAggregateData | null> => {
		if (!existingData) {
			return this.createDefaultAggregate()
		}

		// For existing data, save header first then recompute aggregate
		const dataToSave: FsAbookStoreAbookData = {
			header: headerData,
			aggregate: existingData.aggregate,
		}
		await this.saveAbookData(dataToSave)
		await this.computeAggregate()
		return null // Indicates that computation was handled internally
	}

	private readonly getOrCreateHeaderFile =
		async (): Promise<FsFileHandle> => {
			if (!this.headerFile) {
				this.headerFile = await this.abookRoot.openFile(
					FS_STORE_HEADER_FILE,
					{
						create: true,
					},
				)
			}
			return this.headerFile
		}

	private readonly getHeaderFileOrNull =
		async (): Promise<FsFileHandle | null> => {
			if (!this.headerFile) {
				this.headerFile =
					await this.abookRoot.openFileOrNull(FS_STORE_HEADER_FILE)
			}
			return this.headerFile
		}

	private readonly readAbookEntries = async (): Promise<string[]> => {
		const entriesDir = await this.getOrCreateEntriesDir()
		const stat = await entriesDir.stat()
		const entries = stat.entries

		return entries
			.filter(
				(entry) =>
					entry.type === FsHandleType.FILE &&
					entry.name.endsWith(FS_STORE_ENTRY_DATA_EXTENSION),
			)
			.map((entry) =>
				entry.name.replace(FS_STORE_ENTRY_DATA_EXTENSION, ""),
			)
	}

	private readonly saveAbookData = async (
		data: FsAbookStoreAbookData,
	): Promise<void> => {
		const headerFile = await this.getOrCreateHeaderFile()
		const serialized = this.config.abookSerializer.serialize(data)
		const writer = await headerFile.write()
		await writer.write(serialized)
		await writer.close()
	}

	private readonly readAbookData = async () => {
		const header = await this.getHeaderFileOrNull()
		if (!header) return null
		const file = await header.getFileOrNull()
		if (!file) return null

		const buffer = await Blobs.blobToArrayBuffer(file)

		return this.config.abookSerializer.deserialize(buffer)
	}

	private readonly createDefaultHeaderData = (): AbookHeaderData => ({
		createdAt: Timestamp.fromDate(new Date()),
		metadata: {
			title: "",
			description: "",
			privateUserNote: "",
		},
		position: null,
	})

	private readonly createDefaultAggregate = () => ({
		totalEntries: 0,
		totalDurationMillis: 0,
	})

	private readonly createClearedAggregate = () => ({
		totalEntries: -1,
		totalDurationMillis: -1,
	})
}

/**
 * File system implementation of AbookHandle.
 * Handles CRUD operations for audiobooks stored in the file system.
 */
export class FsAbookHandle implements AbookHandle {
	constructor(
		private readonly impl: FsAbookHandleImpl | null,
		private readonly handleId: string,
	) {
		if (impl && impl.id !== handleId) {
			throw new Error(
				`Handle ID mismatch: expected "${handleId}" but impl has ID "${impl.id}"`,
			)
		}
	}

	public get id() {
		return this.handleId
	}

	/**
	 * Creates a new audiobook in the file system.
	 * @param id - Unique identifier for the audiobook
	 * @param config - Configuration for the store
	 * @param data - Initial header data for the audiobook
	 * @returns Promise resolving to the created audiobook handle
	 */
	public static readonly create = async (
		id: string,
		config: FsAbookStoreConfig,
		data: AbookHeaderData,
	): Promise<FsAbookHandle> => {
		const abookRoot = await config.root.openDir(Path.fromSegment(id), {
			create: true,
			allowExisting: false,
		})
		const impl = new FsAbookHandleImpl(config, abookRoot)
		const handle = new FsAbookHandle(impl, id)
		await impl.writeForCreation({ data })
		return handle
	}

	/**
	 * Creates a handle for an existing audiobook directory.
	 */
	public static readonly fromExisting = (
		config: FsAbookStoreConfig,
		abookRoot: FsDirHandle,
	): FsAbookHandle => {
		const impl = new FsAbookHandleImpl(config, abookRoot)
		return new FsAbookHandle(impl, abookRoot.name)
	}

	/**
	 * Creates a handle that doesn't exist (returns exists() = false).
	 */
	public static readonly createNonExistent = (
		config: FsAbookStoreConfig,
		id: string,
	): FsAbookHandle => {
		return new FsAbookHandle(null, id)
	}

	/**
	 * Checks if the audiobook exists in the file system.
	 */
	public readonly exists = async (): Promise<boolean> => {
		if (!this.impl) return false
		return this.impl.exists()
	}

	/**
	 * Reads the audiobook from the file system.
	 * Returns null if the audiobook doesn't exist.
	 */
	public readonly read = async (): Promise<Abook | null> => {
		if (!this.impl) return null
		return this.impl.read()
	}

	/**
	 * Reads the audiobook from the file system.
	 * Throws an error if the audiobook doesn't exist.
	 */
	public readonly mustRead = async (): Promise<Abook> => {
		const abook = await this.read()
		if (!abook) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return abook
	}

	/**
	 * Writes audiobook header data to the file system.
	 * Handles aggregation based on provided options.
	 * Throws an error if the abook doesn't exist.
	 */
	public readonly write = async (
		options: AbookWriteHeaderOptions,
	): Promise<void> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}

		return this.impl.write(options)
	}

	/**
	 * Creates a new entry in the audiobook.
	 */
	public readonly createEntry = async (
		data: AbookEntryData,
	): Promise<AbookEntryHandle> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return this.impl.createEntry(data)
	}

	/**
	 * Lists all entries in the audiobook.
	 */
	public readonly listEntries = async (): Promise<AbookEntryHandle[]> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return this.impl.listEntries()
	}

	/**
	 * Deletes the audiobook and all its entries from the file system.
	 */
	public readonly delete = async (): Promise<void> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return this.impl.delete()
	}

	/**
	 * Computes and updates the audiobook's aggregate data.
	 */
	public readonly computeAggregate = async (): Promise<void> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return this.impl.computeAggregate()
	}

	/**
	 * Gets or creates the entries directory for this audiobook.
	 * This method is used by FsAbookEntryHandle to access the entries directory.
	 */
	public readonly getOrCreateEntriesDir = async (): Promise<FsDirHandle> => {
		if (!this.impl) {
			throw new AbookNotFoundError(`Abook with id ${this.id} not found`)
		}
		return this.impl.getOrCreateEntriesDir()
	}
}
