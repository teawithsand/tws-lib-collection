import { FileReader } from "./fileReader.js"

/**
 * FileReader implementation that wraps another FileReader and aggregates small chunks
 * or splits large chunks to maintain chunk sizes between min and max bounds
 */
export class ChunkSplitterFileReader implements FileReader {
	private currentChunk: ArrayBuffer | null = null
	private currentOffset = 0
	private aggregationBuffer: ArrayBuffer[] = []
	private aggregationSize = 0

	/**
	 * Creates a new ChunkSplitterFileReader
	 * @param reader - The underlying FileReader to wrap
	 * @param maxChunkSize - Maximum size of chunks to return
	 * @param minChunkSize - Minimum size of chunks to return (defaults to maxChunkSize / 4)
	 */
	constructor(
		private readonly reader: FileReader,
		private readonly maxChunkSize: number,
		private readonly minChunkSize: number = Math.max(
			1,
			Math.floor(maxChunkSize / 4),
		),
	) {
		if (minChunkSize > maxChunkSize) {
			throw new Error("minChunkSize cannot be greater than maxChunkSize")
		}
	}

	/**
	 * Read the next chunk of file data, aggregating small chunks or splitting large ones
	 * @returns The next chunk or null if the file has ended
	 */
	public readonly readChunk = async (): Promise<ArrayBuffer | null> => {
		if (
			this.currentChunk &&
			this.currentOffset < this.currentChunk.byteLength
		) {
			const remaining = this.currentChunk.byteLength - this.currentOffset
			const chunkSize = Math.min(remaining, this.maxChunkSize)
			const chunk = this.currentChunk.slice(
				this.currentOffset,
				this.currentOffset + chunkSize,
			)
			this.currentOffset += chunkSize
			if (this.currentOffset >= this.currentChunk.byteLength) {
				this.currentChunk = null
				this.currentOffset = 0
			}
			return chunk
		}

		while (true) {
			const nextChunk = await this.reader.readChunk()
			if (!nextChunk) {
				if (this.aggregationSize > 0) {
					const result = this.concatenateAggregationBuffer()
					this.clearAggregationBuffer()
					return result
				}
				return null
			}

			if (nextChunk.byteLength === 0) {
				if (this.aggregationSize > 0) {
					const result = this.concatenateAggregationBuffer()
					this.clearAggregationBuffer()
					return result
				}
				return nextChunk
			}

			if (nextChunk.byteLength > this.maxChunkSize) {
				if (this.aggregationSize > 0) {
					const result = this.concatenateAggregationBuffer()
					this.clearAggregationBuffer()

					this.currentChunk = nextChunk
					this.currentOffset = 0
					return result
				}

				this.currentChunk = nextChunk
				this.currentOffset = this.maxChunkSize
				return nextChunk.slice(0, this.maxChunkSize)
			}

			this.aggregationBuffer.push(nextChunk)
			this.aggregationSize += nextChunk.byteLength

			if (this.aggregationSize >= this.minChunkSize) {
				const result = this.concatenateAggregationBuffer()
				this.clearAggregationBuffer()
				return result
			}

			if (this.aggregationSize > this.maxChunkSize) {
				const result = this.concatenateAggregationBuffer()
				this.clearAggregationBuffer()
				return result
			}
		}
	}

	/**
	 * Concatenate all buffers in the aggregation buffer
	 */
	private readonly concatenateAggregationBuffer = (): ArrayBuffer => {
		if (this.aggregationBuffer.length === 1) {
			return this.aggregationBuffer[0]!
		}

		const result = new ArrayBuffer(this.aggregationSize)
		const resultView = new Uint8Array(result)
		let offset = 0
		for (const buffer of this.aggregationBuffer) {
			const view = new Uint8Array(buffer)
			resultView.set(view, offset)
			offset += buffer.byteLength
		}
		return result
	}

	/**
	 * Clear the aggregation buffer
	 */
	private readonly clearAggregationBuffer = (): void => {
		this.aggregationBuffer = []
		this.aggregationSize = 0
	}

	/**
	 * Close the reader
	 */
	public readonly close = async (): Promise<void> => {
		this.currentChunk = null
		this.currentOffset = 0
		this.clearAggregationBuffer()
		await this.reader.close()
	}
}
