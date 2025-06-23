import { BaseHandle } from "./baseHandle"
import { DirOpenSettings } from "./dirOpenSettings"
import { FileHandle } from "./fileHandle"
import { FileOpenSettings } from "./fileOpenSettings"
import { FsEntry } from "./fsEntry"

/**
 * Handle for an open directory.
 */
export interface DirHandle extends BaseHandle {
	/**
	 * Checks if the directory exists.
	 */
	readonly exists: () => Promise<boolean>

	/**
	 * Lists entries in the directory.
	 */
	readonly list: () => Promise<FsEntry[]>

	/**
	 * Creates a subdirectory (recursive).
	 * @param name Name of the subdirectory.
	 */
	readonly mkdir: (name: string) => Promise<void>

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 * @param recursive If true, delete directory recursively.
	 */
	readonly delete: (recursive: boolean) => Promise<void>

	/**
	 * Opens a file handle for a file in this directory.
	 * @param path Relative path to the file.
	 * @param settings Settings for opening the file.
	 */
	readonly openFile: (
		path: string,
		settings?: FileOpenSettings,
	) => Promise<FileHandle>

	/**
	 * Opens a directory handle for a subdirectory in this directory.
	 * @param path Relative path to the directory.
	 * @param settings Settings for opening the directory.
	 */
	readonly openDir: (
		path: string,
		settings?: DirOpenSettings,
	) => Promise<DirHandle>
}
