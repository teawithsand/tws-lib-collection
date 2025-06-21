import { FileReader } from "./fileReader.js"

/**
 * FileReader implementation that reads from in-memory data
 */
export class InMemoryBlobFileReader implements FileReader {
	private currentIndex = 0
	private currentOffset = 0

	/**
	 * Creates a new InMemoryBlobFileReader
	 * @param data - Array of ArrayBuffers or Blobs to read from
	 * @param chunkSize - Size of chunks to return (optional, defaults to 64KB)
	 */
	constructor(
		private readonly data: (ArrayBuffer | Blob)[],
		private readonly chunkSize: number = 64 * 1024,
	) {}

	/**
	 * Read the next chunk of file data
	 * @returns The next chunk or null if all data has been read
	 */
	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		if (this.currentIndex >= this.data.length) {
			return null
		}
		const currentItem = this.data[this.currentIndex]
		if (!currentItem) {
			return null
		}
		if (currentItem instanceof Blob) {
			const remaining = currentItem.size - this.currentOffset
			if (remaining <= 0) {
				this.currentIndex++
				this.currentOffset = 0
				return currentItem.size === 0
					? new ArrayBuffer(0)
					: this.readChunk()
			}
			const chunkSize = Math.min(remaining, this.chunkSize)
			const blob = currentItem.slice(
				this.currentOffset,
				this.currentOffset + chunkSize,
			)
			const arrayBuffer = await blob.arrayBuffer()
			this.currentOffset += chunkSize
			if (this.currentOffset >= currentItem.size) {
				this.currentIndex++
				this.currentOffset = 0
			}
			return arrayBuffer
		}
		const remaining = currentItem.byteLength - this.currentOffset
		if (remaining <= 0) {
			this.currentIndex++
			this.currentOffset = 0
			return currentItem.byteLength === 0
				? new ArrayBuffer(0)
				: this.readChunk()
		}
		const chunkSize = Math.min(remaining, this.chunkSize)
		const chunk = currentItem.slice(
			this.currentOffset,
			this.currentOffset + chunkSize,
		)
		this.currentOffset += chunkSize
		if (this.currentOffset >= currentItem.byteLength) {
			this.currentIndex++
			this.currentOffset = 0
		}
		return chunk
	}

	/**
	 * Close the reader
	 */
	public readonly close = async (): Promise<void> => {
		this.currentIndex = this.data.length
		this.currentOffset = 0
	}
}
