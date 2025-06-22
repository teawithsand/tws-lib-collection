import { FileStatResult } from "./fileStatResult"

/**
 * Handle for an open file.
 */
export interface FileHandle {
	/**
	 * Checks if the file exists.
	 */
	readonly exists: () => Promise<boolean>

	/**
	 * Reads the entire file as a Uint8Array.
	 */
	readonly read: () => Promise<Uint8Array>

	/**
	 * Writes data to the file, replacing if exists.
	 * @param data Data to write.
	 */
	readonly write: (data: Uint8Array) => Promise<void>

	/**
	 * Gets a File object representing the file.
	 */
	readonly getFile: () => Promise<File>

	/**
	 * Opens a writable stream for the file.
	 */
	readonly openWriteStream: () => Promise<WritableStream<Uint8Array>>

	/**
	 * Deletes the file.
	 */
	readonly delete: () => Promise<void>

	/**
	 * Gets stat info for the file.
	 */
	readonly stat: () => Promise<FileStatResult>
}
