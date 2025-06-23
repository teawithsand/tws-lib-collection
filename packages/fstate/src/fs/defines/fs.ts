import { FsDirHandle } from "./dirHandle"

/**
 * File system abstraction interface.
 */
export interface Fs {
	/**
	 * Returns the root directory handle of the file system.
	 */
	readonly getRootDir: () => Promise<FsDirHandle>
}
