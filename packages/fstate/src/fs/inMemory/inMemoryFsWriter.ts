import { FsWriteMode, FsWriter } from "../defines/writer"
import { InMemoryFileNode } from "./db"

/**
 * In-memory implementation of FsWriter.
 *
 * Buffers writes until close() is called, ensuring that reads don't see
 * incomplete writes. Only after close() the content is flushed to the file node.
 */
export class InMemoryFsWriter implements FsWriter {
	private readonly fileNode: InMemoryFileNode
	private readonly mode: FsWriteMode
	private readonly chunks: (ArrayBuffer | Blob)[] = []
	private closed = false

	public constructor({
		fileNode,
		mode = FsWriteMode.OVERWRITE,
	}: {
		fileNode: InMemoryFileNode
		mode?: FsWriteMode
	}) {
		this.fileNode = fileNode
		this.mode = mode
	}

	/**
	 * Writes data to the buffer. Data is not visible to reads until close() is called.
	 */
	public readonly write = async (data: ArrayBuffer | Blob): Promise<void> => {
		if (this.closed) {
			throw new Error("Cannot write to a closed writer")
		}
		this.chunks.push(data)
	}

	/**
	 * Closes the writer and flushes all buffered content to the file node.
	 * After this call, the written content becomes visible to read operations.
	 */
	public readonly close = async (): Promise<void> => {
		if (this.closed) {
			return
		}

		this.closed = true

		// Combine all chunks into a single blob
		const newContentBlob = new Blob(this.chunks)

		if (this.mode === FsWriteMode.OVERWRITE) {
			// Replace the entire content
			this.fileNode.content = newContentBlob
		} else if (this.mode === FsWriteMode.APPEND) {
			// Append to existing content
			this.fileNode.content = new Blob([
				this.fileNode.content,
				newContentBlob,
			])
		}
	}
}
