import { DirHandle } from "../defines/dirHandle"
import { Fs } from "../defines/fs"
import { Path } from "../defines/path"
import { InMemoryDirNode, InMemoryNodeUtil } from "./db"
import { InMemoryDirHandle } from "./inMemoryDirHandle"

/**
 * In-memory implementation of file system.
 */
export class InMemoryFs implements Fs {
	private readonly rootNode: InMemoryDirNode

	public constructor() {
		this.rootNode = InMemoryNodeUtil.createEmptyRootDir()
	}

	/**
	 * Returns the root directory handle of the file system.
	 */
	public readonly getRootDir = async (): Promise<DirHandle> => {
		return new InMemoryDirHandle({
			rootNode: this.rootNode,
			dirPath: new Path("."),
		})
	}
}
