import { FsBaseHandle, FsHandleType } from "./baseHandle"
import { FsWriteSettings, FsWriter } from "./writer"

export enum FsFileOpenMode {
	READ = "read",
	READ_WRITE = "read-write",
}

/**
 * Result of stat operation for a file.
 */
export type FileStatResult =
	| {
			exists: true
			size: number
	  }
	| {
			exists: false
			size: 0
	  }

/**
 * Handle for an open file.
 */
export interface FsFileHandle extends FsBaseHandle {
	readonly type: FsHandleType.FILE

	/**
	 * Mode that this handle was created with.
	 *
	 * Contents of this handle are purely for guidance and may not be accurate.
	 *
	 * If writing works on read only handle, it's OK as far as this type is concerned.
	 */
	readonly openMode: FsFileOpenMode

	/**
	 * Checks if the file exists.
	 */
	readonly exists: () => Promise<boolean>

	/**
	 * Gets a File object representing the file. Throws an error if the file does not exist.
	 *
	 * @throws Error when file does not exist.
	 */
	readonly getFile: () => Promise<File>

	/**
	 * Gets a File object representing the file.  Does not throw when file does not exist. Returns null instead.
	 *
	 * @throws When file exists, but there is some issue with it.
	 */
	readonly getFileOrNull: () => Promise<File | null>

	/**
	 * Deletes the file.
	 */
	readonly delete: () => Promise<void>

	/**
	 * Gets stat info for the file.
	 */
	readonly stat: () => Promise<FileStatResult>

	/**
	 * Writes contents to this file.
	 *
	 * @param options Write options.
	 * @returns Writer for writing to the file.
	 */
	readonly write: (options?: FsWriteSettings) => Promise<FsWriter>
}
