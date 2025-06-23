import { Path } from "./path.js"

/**
 * Base interface for file and directory handles.
 */
export interface BaseHandle {
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
