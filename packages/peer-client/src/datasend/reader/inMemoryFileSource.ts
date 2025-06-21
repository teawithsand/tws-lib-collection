import { FileReader, FileSource } from "./fileReader.js"
import { InMemoryBlobFileReader } from "./inMemoryBlobFileReader.js"

/**
 * FileSource implementation that provides files from in-memory data
 */
export class InMemoryFileSource<TFileHeader>
	implements FileSource<TFileHeader>
{
	private currentIndex = 0

	/**
	 * Creates a new InMemoryFileSource
	 * @param files - Array of tuples containing file headers and their corresponding data
	 * @param chunkSize - Size of chunks to return from readers (optional, defaults to 64KB)
	 */
	constructor(
		private readonly files: Array<[TFileHeader, ArrayBuffer | Blob]>,
		private readonly chunkSize: number = 64 * 1024,
	) {}

	/**
	 * Get the next file to send
	 * @returns File reader and header, or null if no more files
	 */
	public readonly next = async (): Promise<{
		reader: FileReader
		header: TFileHeader
	} | null> => {
		if (this.currentIndex >= this.files.length) {
			return null
		}

		const fileEntry = this.files[this.currentIndex]
		if (!fileEntry) {
			return null
		}

		const [header, data] = fileEntry
		this.currentIndex++

		const reader = new InMemoryBlobFileReader([data], this.chunkSize)

		return { reader, header }
	}

	/**
	 * Close the file source when all files have been sent
	 */
	public readonly close = async (): Promise<void> => {}
}
