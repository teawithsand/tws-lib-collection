import { Path } from "./path.js"

/**
 * Base interface for file and directory handles.
 */
export interface BaseHandle {
	/**
	 * Path of the handle as a Path class instance.
	 */
	readonly path: Path
}
