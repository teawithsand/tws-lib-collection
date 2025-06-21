import { ChunkSplitterFileReader } from "./chunkSplitterFileReader.js"
import { FileReader, FileSource } from "./fileReader.js"

/**
 * FileSource wrapper that wraps file readers from an inner FileSource with ChunkSplitterFileReader
 */
export class ChunkSplitterFileSource<TFileHeader>
	implements FileSource<TFileHeader>
{
	/**
	 * Creates a new ChunkSplitterFileSource
	 * @param innerSource - The underlying FileSource to wrap
	 * @param maxChunkSize - Maximum size of chunks to return from readers
	 * @param minChunkSize - Minimum size of chunks to return from readers (optional, defaults to maxChunkSize / 4)
	 */
	constructor(
		private readonly innerSource: FileSource<TFileHeader>,
		private readonly maxChunkSize: number,
		private readonly minChunkSize?: number,
	) {}

	/**
	 * Get the next file to send, wrapped with ChunkSplitterFileReader
	 * @returns File reader wrapped with ChunkSplitterFileReader and header, or null if no more files
	 */
	public readonly next = async (): Promise<{
		reader: FileReader
		header: TFileHeader
	} | null> => {
		const fileData = await this.innerSource.next()
		if (!fileData) {
			return null
		}

		const wrappedReader = new ChunkSplitterFileReader(
			fileData.reader,
			this.maxChunkSize,
			this.minChunkSize,
		)

		return {
			reader: wrappedReader,
			header: fileData.header,
		}
	}

	/**
	 * Close the file source when all files have been sent
	 */
	public readonly close = async (): Promise<void> => {
		await this.innerSource.close()
	}
}
