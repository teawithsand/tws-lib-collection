import { FileReceiverHandler, FileWriter } from "./fileWriter.js"

/**
 * A file writer that stores chunks as blobs in memory
 */
export class BlobFileWriter implements FileWriter {
	private chunks: ArrayBuffer[] = []
	private currentBlob: Blob | null = null
	private isClosed = false
	private unaggregatedBytes = 0
	private readonly chunkAggregationThreshold = 1024 * 1024

	/**
	 * Write a chunk of file data to memory
	 */
	public readonly writeChunk = async (chunk: ArrayBuffer): Promise<void> => {
		if (this.isClosed) {
			throw new Error("Cannot write to a closed file writer")
		}
		const chunkCopy = chunk.slice()
		this.chunks.push(chunkCopy)
		this.unaggregatedBytes += chunkCopy.byteLength
		if (this.unaggregatedBytes >= this.chunkAggregationThreshold) {
			this.aggregateChunksToBlob()
		}
	}

	/**
	 * Close the writer and mark it as completed
	 */
	public readonly close = async (): Promise<void> => {
		if (this.chunks.length > 0) {
			this.aggregateChunksToBlob()
		}
		this.isClosed = true
		this.chunks.length = 0
		this.unaggregatedBytes = 0
	}

	/**
	 * Aggregate current chunks into a blob and clear chunks array
	 */
	private aggregateChunksToBlob = (): void => {
		if (this.chunks.length > 0) {
			const newBlob = new Blob(this.chunks)
			if (this.currentBlob !== null) {
				this.currentBlob = new Blob([this.currentBlob, newBlob])
			} else {
				this.currentBlob = newBlob
			}
			this.chunks.length = 0
			this.unaggregatedBytes = 0
		}
	}

	/**
	 * Get the complete file data as a Blob
	 * @returns The file data as a Blob
	 */
	public getBlob = (): Blob => {
		const parts: (Blob | ArrayBuffer)[] = []
		if (this.currentBlob !== null) {
			parts.push(this.currentBlob)
		}
		if (this.chunks.length > 0) {
			parts.push(...this.chunks)
		}
		return new Blob(parts)
	}

	/**
	 * Check if the writer is closed
	 */
	public get closed(): boolean {
		return this.isClosed
	}
}

/**
 * A file receiver handler that creates BlobFileWriter instances
 */
export class BlobFileReceiverHandler<TGlobalHeader, TFileHeader>
	implements FileReceiverHandler<TGlobalHeader, TFileHeader>
{
	private fileWriters: BlobFileWriter[] = []
	private globalHeaders: Map<BlobFileWriter, TGlobalHeader> = new Map()
	private fileHeaders: Map<BlobFileWriter, TFileHeader> = new Map()

	/**
	 * Create a file writer for the incoming file
	 */
	public createFileWriter = async (
		globalHeader: TGlobalHeader,
		fileHeader: TFileHeader,
		_fileIndex: number,
	): Promise<FileWriter> => {
		const writer = new BlobFileWriter()
		this.fileWriters.push(writer)
		this.globalHeaders.set(writer, globalHeader)
		this.fileHeaders.set(writer, fileHeader)
		return writer
	}

	/**
	 * Close the receiver handler when all files have been received
	 */
	public close = async (): Promise<void> => {}

	/**
	 * Get the global header for a specific writer (nullable version)
	 * @param writer - The file writer to get the header for
	 * @returns The global header or null if not found
	 */
	public getGlobalHeader = (writer: BlobFileWriter): TGlobalHeader | null => {
		return this.globalHeaders.get(writer) ?? null
	}

	/**
	 * Get the global header for a specific writer (throwing version)
	 * @param writer - The file writer to get the header for
	 * @returns The global header
	 * @throws Error if global header is not found
	 */
	public getGlobalHeaderOrThrow = (writer: BlobFileWriter): TGlobalHeader => {
		const header = this.globalHeaders.get(writer)
		if (header === undefined) {
			throw new Error("Global header not found for the specified writer")
		}
		return header
	}

	/**
	 * Get all received data from completed file transfers
	 * @param safe - If true, throws error if any file writers are not closed
	 * @returns Array of pairs containing file header and blob for each received file
	 */
	public getReceivedData = (safe = false): Array<[TFileHeader, Blob]> => {
		if (safe) {
			const unclosedWriters = this.fileWriters.filter(
				(writer) => !writer.closed,
			)
			if (unclosedWriters.length > 0) {
				throw new Error(
					`Cannot get received data safely: ${unclosedWriters.length} file writer(s) are still open`,
				)
			}
		}
		return this.fileWriters.map((writer) => {
			const fileHeader = this.fileHeaders.get(writer)
			if (fileHeader === undefined) {
				throw new Error("File header not found for writer")
			}
			return [fileHeader, writer.getBlob()] as [TFileHeader, Blob]
		})
	}

	/**
	 * Get the number of file writers created
	 */
	public get fileWriterCount(): number {
		return this.fileWriters.length
	}
}
