import { FsWriteMode, FsWriter, FsWriteSettings } from "../defines/writer"
import { OpfsErrorUtil } from "./opfsError"

/**
 * OPFS implementation of FsWriter for writing files using the FileSystemWritableFileStream API.
 */
export class OpfsFsWriter implements FsWriter {
	private readonly stream: FileSystemWritableFileStream
	private closed = false

	/**
	 * @param stream FileSystemWritableFileStream to write to
	 * @param settings Optional write settings
	 * @param fileSize Optional file size (required for append mode)
	 */
	public constructor(stream: FileSystemWritableFileStream) {
		this.stream = stream
	}

	/**
	 * Writes data to the file. In append mode, seeks to the end before the first write only.
	 * @param data Data to write (ArrayBuffer or Blob)
	 */
	public readonly write = async (data: ArrayBuffer | Blob): Promise<void> => {
		if (this.closed) throw new Error("Writer is already closed")
		try {
			await this.stream.write(data)
		} catch (e) {
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to write data to file",
			)
		}
	}

	/**
	 * Closes the writer and underlying stream.
	 */
	public readonly close = async (): Promise<void> => {
		if (this.closed) return
		try {
			await this.stream.close()
		} catch (e) {
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to close file writer",
			)
		}
		this.closed = true
	}

	/**
	 * Creates an OpfsFsWriter for a given FileSystemFileHandle.
	 * @param handle FileSystemFileHandle to write to
	 * @param settings Optional write settings
	 * @returns OpfsFsWriter instance
	 */
	public static readonly fromFileHandle = async (
		handle: FileSystemFileHandle,
		settings: FsWriteSettings = {},
	): Promise<OpfsFsWriter> => {
		const mode = settings.mode ?? FsWriteMode.OVERWRITE
		let stream: FileSystemWritableFileStream
		try {
			stream = await handle.createWritable({
				keepExistingData: mode === FsWriteMode.APPEND,
			})
			if (mode === FsWriteMode.APPEND) {
				const file = await handle.getFile()
				await stream.seek(file.size)
			}
		} catch (e) {
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to create writable file stream",
			)
		}
		return new OpfsFsWriter(stream)
	}
}
