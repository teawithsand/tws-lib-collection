import { DirHandle } from "../defines/dirHandle"
import { Fs } from "../defines/fs"
import { Path } from "../defines/path"
import { OpfsDirHandle } from "./opfsDirHandle.js"

/**
 * OPFS (Origin Private File System) implementation of file system.
 *
 * This implementation uses the browser's Origin Private File System API
 * to provide a file system abstraction that persists data locally.
 */
export class OpfsFs implements Fs {
	private readonly rootDirectoryHandle: FileSystemDirectoryHandle

	/**
	 * Creates a new OPFS file system instance.
	 * @param rootDirectoryHandle - The OPFS directory handle to use as root
	 */
	public constructor(rootDirectoryHandle: FileSystemDirectoryHandle) {
		this.rootDirectoryHandle = rootDirectoryHandle
	}

	/**
	 * Returns the root directory handle of the file system.
	 */
	public readonly getRootDir = async (): Promise<DirHandle> => {
		return new OpfsDirHandle({
			directoryHandle: this.rootDirectoryHandle,
			dirPath: new Path("."),
			rootHandle: this.rootDirectoryHandle,
		})
	}
}
