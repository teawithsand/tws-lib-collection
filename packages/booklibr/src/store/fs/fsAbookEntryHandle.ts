import { FsDirHandle } from "@teawithsand/fstate"
import { Blobs, Timestamp } from "@teawithsand/lngext"
import {
	AbookAggregateData,
	AbookEntry,
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
} from "../../defines"
import {
	AbookEntryBlobNotFoundError,
	AbookEntryHandle,
	AbookEntryNotFoundError,
	AbookEntryWriteOptions,
	AbookHandle,
	AbookNotFoundError,
} from "../defines"
import {
	AbookWriteAggregate,
	AbookWriteAggregateType,
} from "../defines/aggregate"
import { createEntryBlobPath, createEntryDataPath } from "./constants"
import { FsAbookStoreAbookEntryData, FsAbookStoreConfig } from "./store"

// Interface for FsAbookHandle to avoid circular dependency
interface FsAbookHandleInterface extends AbookHandle {
	getOrCreateEntriesDir(): Promise<FsDirHandle>
}

/**
 * File system implementation of AbookEntryHandle.
 * Handles CRUD operations for individual audiobook entries stored in the file system.
 */
export class FsAbookEntryHandle implements AbookEntryHandle {
	constructor(
		private readonly config: FsAbookStoreConfig,
		public readonly abookHandle: FsAbookHandleInterface,
		public readonly id: string,
	) {}

	/**
	 * Checks if the entry exists in the file system.
	 */
	public readonly exists = async (): Promise<boolean> => {
		try {
			const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
			const entryFile = await entriesDir.openFile(
				createEntryDataPath(this.id),
			)
			return await entryFile.exists()
		} catch {
			return false
		}
	}

	/**
	 * Validates that the entry exists and throws appropriate error if not.
	 * @throws {AbookEntryNotFoundError} When the entry doesn't exist
	 */
	private readonly validateEntryExists = async (): Promise<void> => {
		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
		const entryFile = await entriesDir.openFileOrNull(
			createEntryDataPath(this.id),
		)

		if (!entryFile || !(await entryFile.exists())) {
			throw new AbookEntryNotFoundError(
				`Entry with id ${this.id} not found`,
			)
		}
	}

	/**
	 * Reads the entry from the file system.
	 * Returns null if the entry doesn't exist.
	 */
	public readonly read = async (): Promise<AbookEntry | null> => {
		try {
			const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
			const entryFile = await entriesDir.openFile(
				createEntryDataPath(this.id),
			)
			const file = await entryFile.getFileOrNull()
			if (!file) return null

			const buffer = await Blobs.blobToArrayBuffer(file)

			// If the file is empty, return null instead of trying to deserialize empty content
			if (buffer.byteLength === 0) return null

			const entryData =
				this.config.abookEntrySerializer.deserialize(buffer)

			return new AbookEntry({
				aggregate: entryData.aggregate,
				data: entryData.data,
			})
		} catch {
			return null
		}
	}

	/**
	 * Reads the entry from the file system.
	 * Throws an error if the entry doesn't exist.
	 */
	public readonly mustRead = async (): Promise<AbookEntry> => {
		const entry = await this.read()
		if (!entry) {
			throw new AbookNotFoundError(`Entry with id ${this.id} not found`)
		}
		return entry
	}

	/**
	 * Writes entry data to the file system.
	 * Handles aggregation based on provided options.
	 */
	public readonly write = async (
		options: AbookEntryWriteOptions,
	): Promise<void> => {
		const existingEntry = await this.read()
		const existingData = existingEntry?.data
		const existingAggregate = existingEntry?.aggregate

		const data =
			options.data ?? existingData ?? this.createDefaultEntryData()

		let aggregate = existingAggregate ?? this.createDefaultAggregate()

		// Handle aggregate options
		const aggregateOptions = options.aggregate
		if (aggregateOptions) {
			switch (aggregateOptions.type) {
				case AbookWriteAggregateType.RECOMPUTE:
					await this.computeAggregate()
					return
				case AbookWriteAggregateType.CLEAR:
					aggregate = this.createDefaultAggregate()
					break
				case AbookWriteAggregateType.LEAVE_UNMODIFIED:
					break
				case AbookWriteAggregateType.SET:
					aggregate = aggregateOptions.data
					break
			}
		}

		const entryData: FsAbookStoreAbookEntryData = {
			data,
			aggregate,
		}

		await this.saveEntryData(entryData)
		await this.handleParentAggregateOptions(options.parentAggregate)
	}

	/**
	 * Gets a writer for the entry's blob file.
	 */
	public readonly getBlobWriter = async () => {
		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
		const blobFile = await entriesDir.openFile(
			createEntryBlobPath(this.id),
			{
				create: true,
			},
		)
		return await blobFile.write()
	}

	/**
	 * Reads the entry's blob data.
	 * Returns null if the blob file doesn't exist.
	 */
	public readonly readBlob = async (): Promise<Blob | null> => {
		// Check if entry data file exists first
		await this.validateEntryExists()

		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
		const blobFile = await entriesDir.openFileOrNull(
			createEntryBlobPath(this.id),
		)
		if (!blobFile) {
			return null
		}

		const file = await blobFile.getFileOrNull()
		return file ?? null
	}

	/**
	 * Reads the entry's blob data.
	 * Throws AbookEntryBlobNotFoundError if the blob file doesn't exist.
	 */
	public readonly mustReadBlob = async (): Promise<Blob> => {
		// Check if entry data file exists first
		await this.validateEntryExists()

		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
		const blobFile = await entriesDir.openFileOrNull(
			createEntryBlobPath(this.id),
		)
		if (!blobFile) {
			throw new AbookEntryBlobNotFoundError(
				`No blob found for entry ${this.id}`,
			)
		}

		const file = await blobFile.getFileOrNull()
		if (!file) {
			throw new AbookEntryBlobNotFoundError(
				`No blob found for entry ${this.id}`,
			)
		}

		return file
	}

	/**
	 * Deletes the entry and its associated blob file from the file system.
	 */
	public readonly delete = async (): Promise<void> => {
		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()

		// Delete the entry data file
		const entryFile = await entriesDir.openFileOrNull(
			createEntryDataPath(this.id),
		)
		if (entryFile) {
			await entryFile.delete()
		}

		// Delete the blob file if it exists
		const blobFile = await entriesDir.openFileOrNull(
			createEntryBlobPath(this.id),
		)
		if (blobFile) {
			await blobFile.delete()
		}
	}

	/**
	 * Computes and updates the entry's aggregate data.
	 */
	public readonly computeAggregate = async (): Promise<void> => {
		const existingEntry = await this.read()
		if (!existingEntry) return

		const blob = await this.readBlob()
		if (!blob) {
			// If no blob exists, set aggregate to default/null values
			const entryData: FsAbookStoreAbookEntryData = {
				data: existingEntry.data,
				aggregate: this.createDefaultAggregate(),
			}
			await this.saveEntryData(entryData)
			return
		}

		const newAggregate = await this.config.abookEntryAggregator.aggregate(
			existingEntry.data,
			blob,
		)

		const entryData: FsAbookStoreAbookEntryData = {
			data: existingEntry.data,
			aggregate: newAggregate,
		}

		await this.saveEntryData(entryData)
	}

	private readonly createDefaultEntryData = (): AbookEntryData => ({
		createdAt: Timestamp.fromDate(new Date()),
		name: "Untitled Entry",
		disposition: AbookEntryDisposition.PLAYABLE_AUDIO,
		ordinalNumber: 1,
		source: {
			type: AbookEntrySourceType.UPLOAD,
			uploadedAt: Date.now(),
			uploadFileName: "unknown",
			uploadFileMime: "application/octet-stream",
		},
	})

	private readonly createDefaultAggregate = () => ({
		metadata: null,
		blobSize: null,
	})

	private readonly saveEntryData = async (
		entryData: FsAbookStoreAbookEntryData,
	): Promise<void> => {
		const entriesDir = await this.abookHandle.getOrCreateEntriesDir()
		const entryFile = await entriesDir.openFile(
			createEntryDataPath(this.id),
			{
				create: true,
			},
		)

		const serialized = this.config.abookEntrySerializer.serialize(entryData)
		const writer = await entryFile.write()
		await writer.write(serialized)
		await writer.close()
	}

	private readonly handleParentAggregateOptions = async (
		parentAggregateOptions?: AbookWriteAggregate<AbookAggregateData>,
	): Promise<void> => {
		if (!parentAggregateOptions) return

		switch (parentAggregateOptions.type) {
			case AbookWriteAggregateType.RECOMPUTE:
				await this.abookHandle.computeAggregate()
				break
			case AbookWriteAggregateType.CLEAR:
				await this.abookHandle.write({
					aggregate: {
						type: AbookWriteAggregateType.CLEAR,
					},
				})
				break
			case AbookWriteAggregateType.LEAVE_UNMODIFIED:
				break
			case AbookWriteAggregateType.SET:
				await this.abookHandle.write({
					aggregate: {
						type: AbookWriteAggregateType.SET,
						data: parentAggregateOptions.data,
					},
				})
				break
		}
	}
}
