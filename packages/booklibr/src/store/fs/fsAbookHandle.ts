import {
	FsDirHandle,
	FsFileHandle,
	FsHandleType,
	Path,
} from "@teawithsand/fstate"
import { Blobs, generateUuid, Timestamp } from "@teawithsand/lngext"
import {
	Abook,
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
 * File system implementation of AbookHandle.
 * Handles CRUD operations for audiobooks stored in the file system.
 */
export class FsAbookHandle implements AbookHandle {
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
	 * Creates a new audiobook in the file system.
	 */
	public static readonly create = async (
		id: string,
		config: FsAbookStoreConfig,
		data: AbookHeaderData,
	) => {
		const abookRoot = await config.root.openDir(Path.from(id), {
			create: true,
			allowExisting: false,
		})
		const handle = new FsAbookHandle(config, abookRoot)
		await handle.write({ data })
		return handle
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
				const entryHandle = new FsAbookEntryHandle(
					this.config,
					this,
					id,
				)
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
		const headerData =
			options.data ??
			existingData?.header ??
			this.createDefaultHeaderData()

		let aggregate = existingData?.aggregate ?? null

		const aggregateOptions = options.aggregate
		if (aggregateOptions) {
			switch (aggregateOptions.type) {
				case AbookWriteAggregateType.RECOMPUTE:
					await this.computeAggregate()
					return
				case AbookWriteAggregateType.CLEAR:
					aggregate = this.createClearedAggregate()
					break
				case AbookWriteAggregateType.LEAVE_UNMODIFIED:
					break
				case AbookWriteAggregateType.SET:
					aggregate = aggregateOptions.data
					break
			}
		} else {
			// If no aggregate options and no existing data, use default aggregate
			// Otherwise, recompute the aggregate after saving the header
			if (!existingData) {
				aggregate = this.createDefaultAggregate()
			} else {
				// We need to save the header first, then recompute aggregate
				const dataToSave: FsAbookStoreAbookData = {
					header: headerData,
					aggregate: existingData.aggregate,
				}
				await this.saveAbookData(dataToSave)
				await this.computeAggregate()
				return
			}
		}

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

		const entryFile = await entriesDir.openFile(
			Path.from(id + FS_STORE_ENTRY_DATA_EXTENSION),
			{
				create: true,
				allowExisting: false,
			},
		)

		const serialized = this.config.abookEntrySerializer.serialize(entryData)
		const writer = await entryFile.write()
		await writer.write(serialized)
		await writer.close()

		return new FsAbookEntryHandle(this.config, this, id)
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
			.map(
				(entry) =>
					new FsAbookEntryHandle(
						this.config,
						this,
						entry.name.replace(FS_STORE_ENTRY_DATA_EXTENSION, ""),
					),
			)
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
		const richAbook = await this.mustRead()

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
