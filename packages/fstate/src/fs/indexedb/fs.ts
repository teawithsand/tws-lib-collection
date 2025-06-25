import { FsHandleType } from "../defines/baseHandle"
import { Fs } from "../defines/fs"
import { Path } from "../defines/path"
import { IndexedDbFsDb } from "./database"
import { IndexedDbDirHandle } from "./dirHandle"

/**
 * IndexedDB implementation of the Fs interface for persistent browser storage.
 */
export class IndexedDbFs implements Fs {
	private readonly db: IndexedDbFsDb
	private readonly rootPath: Path

	public constructor(config?: { dbName?: string; storeName?: string }) {
		this.db = new IndexedDbFsDb(config)
		this.rootPath = Path.from("")
	}

	public readonly getRootDir = async () => {
		// Ensure root directory exists
		const rootHandle = this.db.getHandle(this.rootPath)
		const exists = await rootHandle.isValid()
		if (!exists) {
			await rootHandle.writeForce({
				type: FsHandleType.DIR,
				children: [],
			})
		}
		return new IndexedDbDirHandle(this.db, this.rootPath)
	}

	/**
	 * Closes the database connection. Used for cleanup in tests.
	 */
	public readonly close = () => {
		this.db.close()
	}
}
