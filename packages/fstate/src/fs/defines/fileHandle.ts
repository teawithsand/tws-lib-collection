import { BaseHandle } from "./baseHandle"
import { FileStatResult } from "./fileStatResult"

/**
 * Handle for an open file.
 */
export interface FileHandle extends BaseHandle {
	/**
	 * Checks if the file exists.
	 */
	readonly exists: () => Promise<boolean>

	/**
	 * Reads the entire file as a Uint8Array.
	 */
	readonly read: () => Promise<Uint8Array>

	/**
	 * Gets a File object representing the file.
	 */
	readonly getFile: () => Promise<File>

	/**
	 * Deletes the file.
	 */
	readonly delete: () => Promise<void>

	/**
	 * Gets stat info for the file.
	 */
	readonly stat: () => Promise<FileStatResult>
}
