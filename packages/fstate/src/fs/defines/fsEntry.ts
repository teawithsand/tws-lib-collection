import { Path } from "./path"

/**
 * Represents a file system entry (file or directory).
 */
export interface FsEntry {
	/**
	 * Relative path of the entry within the file system.
	 */
	readonly path: Path
	readonly isDirectory: boolean
	readonly lastModified?: number
}
