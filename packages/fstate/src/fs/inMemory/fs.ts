import { FsHandleType } from "../defines/baseHandle"
import { Fs } from "../defines/fs"
import { Path } from "../defines/path"
import { InMemoryFsDb } from "./database"
import { InMemoryDirHandle } from "./dirHandle"

/**
 * In-memory implementation of the Fs interface.
 */
export class InMemoryFs implements Fs {
	private readonly db: InMemoryFsDb
	private readonly rootPath: Path

	public constructor() {
		this.db = new InMemoryFsDb()
		this.rootPath = Path.parse("")
		const rootHandle = this.db.getHandle(this.rootPath)
		if (!rootHandle.read()) {
			rootHandle.writeForce({ type: FsHandleType.DIR, children: [] })
		}
	}

	public readonly getRootDir = async () => {
		return new InMemoryDirHandle(this.db, this.rootPath)
	}
}
