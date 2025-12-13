import { AbookStoreService } from "@/domain/abookStore/abookStoreService"
import {
	AbookEntryData,
	AbookEntryDisposition,
	AbookEntrySourceType,
	AbookHeaderData,
} from "@teawithsand/booklibr"
import { DefaultClock, Timestamp } from "@teawithsand/lngext"

/**
 * Data required to create a new audiobook with entries.
 */
export interface AbookCreateData {
	/** Title of the audiobook */
	title: string
	/** Optional description */
	description?: string
	/** Optional private note */
	privateNote?: string
	/** Audio files and other files to create entries from */
	files: File[]
}

/**
 * Options for creating an audiobook entry from a file.
 */
export interface CreateEntryFromFileOptions {
	/** The file to create entry from */
	file: File
	/** Optional custom title (defaults to filename without extension) */
	title?: string
	/** Optional description */
	description?: string
}

/**
 * Result of audiobook creation operation.
 */
export interface AbookCreateResult {
	/** The ID of the created audiobook */
	abookId: string | number
	/** Number of entries successfully created */
	entriesCreated: number
	/** Any errors that occurred during entry creation */
	entryErrors: Array<{ file: File; error: Error }>
}

/**
 * Behavior class that handles the logic for creating audiobooks with entries.
 * Separates business logic from UI components.
 */
export class AbookCreateBehavior {
	constructor(private readonly abookStoreService: AbookStoreService) {}

	/**
	 * Creates an audiobook header data from create data.
	 */
	private createHeaderData(data: AbookCreateData): AbookHeaderData {
		return {
			createdAt: DefaultClock.getInstance().getNow(),
			metadata: {
				title: data.title,
				description: data.description || "",
				privateUserNote: data.privateNote || "",
			},
			position: null,
		}
	}

	/**
	 * Creates entry data from a file.
	 */
	private createEntryDataFromFile(
		file: File,
		ordinalNumber: number,
		options?: Omit<CreateEntryFromFileOptions, "file">,
	): AbookEntryData {
		const nameFromFile = file.name.replace(/\.[^/.]+$/, "")
		const isAudio = this.isAudioFile(file)

		return {
			createdAt: Timestamp.fromDate(new Date()),
			name: options?.title || nameFromFile,
			disposition: isAudio
				? AbookEntryDisposition.PLAYABLE_AUDIO
				: AbookEntryDisposition.UNKNOWN,
			source: {
				type: AbookEntrySourceType.UPLOAD,
				uploadedAt: Timestamp.fromDate(new Date()),
				uploadFileName: file.name,
				uploadFileMime: file.type || "application/octet-stream",
			},
			ordinalNumber,
		}
	}

	/**
	 * Checks if a file is an audio file based on MIME type.
	 */
	private isAudioFile(file: File): boolean {
		return file.type.startsWith("audio/")
	}

	/**
	 * Creates an audiobook with all provided files as entries.
	 * Audio files are prioritized and created first.
	 *
	 * @param data - The audiobook creation data
	 * @returns Result containing the created audiobook ID and statistics
	 */
	async createAbookWithEntries(
		data: AbookCreateData,
	): Promise<AbookCreateResult> {
		// Create the audiobook header
		const headerData = this.createHeaderData(data)
		const abookHandle =
			await this.abookStoreService.abookStore.createAbook(headerData)

		// Separate audio and non-audio files, prioritizing audio files
		const audioFiles = data.files.filter((file) => this.isAudioFile(file))
		const otherFiles = data.files.filter((file) => !this.isAudioFile(file))
		const sortedFiles = [...audioFiles, ...otherFiles]

		// Create entries for each file
		const entryErrors: Array<{ file: File; error: Error }> = []
		let entriesCreated = 0

		for (let i = 0; i < sortedFiles.length; i++) {
			const file = sortedFiles[i]
			try {
				const entryData = this.createEntryDataFromFile(file, i + 1)

				const entryHandle = await abookHandle.createEntry(entryData)

				const blobWriter = await entryHandle.getBlobWriter()
				await blobWriter.write(file)
				await blobWriter.close()
				entriesCreated++

				await entryHandle.computeAggregate()
			} catch (error) {
				entryErrors.push({
					file,
					error:
						error instanceof Error
							? error
							: new Error(String(error)),
				})
			}
		}

		await abookHandle.computeAggregate()

		return {
			abookId: abookHandle.id,
			entriesCreated,
			entryErrors,
		}
	}
}
