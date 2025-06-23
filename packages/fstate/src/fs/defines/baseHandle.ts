import { FsDirHandle } from "./dirHandle"
import { FsFileHandle } from "./fileHandle.js"
import { Path } from "./path"

/**
 * Type of a handle. Either directory or file.
 */
export enum FsHandleType {
	FILE = "file",
	DIR = "dir",
}

/**
 * Represents a file system handle, which can be either a file or a directory.
 */
export type FsHandle = FsDirHandle | FsFileHandle

/**
 * Base interface for file and directory handles.
 */
export interface FsBaseHandle {
	/**
	 * Type of the handle. Either file or dir.
	 */
	readonly type: FsHandleType
	/**
	 * Name of the handle (basename of the path).
	 */
	readonly name: string

	/**
	 * Path of the handle as a Path class instance.
	 *
	 * Relative path of the entry within the file system.
	 */
	readonly path: Path
}
