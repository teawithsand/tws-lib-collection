import { FsDirHandle } from "../defines/dirHandle"
import { Fs } from "../defines/fs"
import { Path } from "../defines/path"
import { OpfsDirHandle } from "./dirHandle"

/**
 * Not Implemented Yet (NIY) OPFS implementation of the Fs interface.
 * This is a placeholder implementation that throws "Not implemented yet" errors for operations.
 */
export class OpfsFs implements Fs {
	private readonly rootDirectory: FileSystemDirectoryHandle

	public constructor(rootDirectory: FileSystemDirectoryHandle) {
		this.rootDirectory = rootDirectory
	}

	public readonly getRootDir = async (): Promise<FsDirHandle> => {
		return new OpfsDirHandle(null, this.rootDirectory, Path.from(""))
	}
}
