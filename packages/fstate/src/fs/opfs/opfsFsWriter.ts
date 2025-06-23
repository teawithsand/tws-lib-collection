import { FsWriteMode, FsWriteOptions, FsWriter } from "../defines/writer"

/**
 * OPFS implementation of FsWriter.
 *
 * Uses FileSystemWritableFileStream to write data to OPFS files.
 * The stream is created when the writer is instantiated and closed when close() is called.
 */
export class OpfsFsWriter implements FsWriter {
	private readonly fileHandle: FileSystemFileHandle
	private readonly mode: FsWriteMode
	private writableStream: FileSystemWritableFileStream | null = null
	private closed = false

	public constructor({
		fileHandle,
		options,
	}: {
		fileHandle: FileSystemFileHandle
		options?: FsWriteOptions
	}) {
		this.fileHandle = fileHandle
		this.mode = options?.mode ?? FsWriteMode.OVERWRITE
	}

	/**
	 * Writes data to the file. Creates the writable stream on first write.
	 */
	public readonly write = async (data: ArrayBuffer | Blob): Promise<void> => {
		if (this.closed) {
			throw new Error("Cannot write to a closed writer")
		}

		// Create writable stream on first write
		if (!this.writableStream) {
			this.writableStream = await this.fileHandle.createWritable({
				keepExistingData: this.mode === FsWriteMode.APPEND,
			})

			// If appending, seek to the end of the file
			if (this.mode === FsWriteMode.APPEND) {
				try {
					const file = await this.fileHandle.getFile()
					await this.writableStream.seek(file.size)
				} catch {
					// If we can't get file size, we'll just write at current position
				}
			}
		}

		await this.writableStream.write(data)
	}

	/**
	 * Closes the writer and commits all writes to the file.
	 */
	public readonly close = async (): Promise<void> => {
		if (this.closed) {
			return
		}

		this.closed = true

		if (this.writableStream) {
			await this.writableStream.close()
			this.writableStream = null
		}
	}
}
