import { FsHandleType, Path } from "../defines"

export type InMemoryFsDbEntry =
	| {
			type: FsHandleType.FILE
			content: Blob
	  }
	| {
			type: FsHandleType.DIR
			children: string[] // Names of child entries to append to path
	  }

class Storage {
	public readonly entriesMap: Map<string, InMemoryFsDbEntry> = new Map()
}

export class InMemoryFsDb {
	private readonly storage

	constructor() {
		this.storage = new Storage()
	}

	public readonly getHandle = (path: Path): InMemoryFsDbHandle => {
		return new InMemoryFsDbHandle(path, this.storage)
	}
}

export class InMemoryFsDbHandle {
	constructor(
		private readonly path: Path,
		private readonly storage: Storage,
	) {}

	public readonly name = this.path.basename() ?? ""

	public readonly isValid = (): boolean => {
		return this.storage.entriesMap.has(this.path.toString())
	}

	public readonly getPath = (): Path => {
		return this.path
	}

	public readonly writeForce = (entry: InMemoryFsDbEntry) => {
		this.storage.entriesMap.set(this.path.toString(), entry)
	}

	public readonly writeThrowing = (entry: InMemoryFsDbEntry) => {
		if (!this.storage.entriesMap.has(this.path.toString())) {
			throw new Error(
				`Entry at path ${this.path.toString()} does not exist.`,
			)
		}
		this.storage.entriesMap.set(this.path.toString(), entry)
	}

	public readonly writeFallible = (entry: InMemoryFsDbEntry): boolean => {
		if (!this.storage.entriesMap.has(this.path.toString())) {
			return false
		}
		this.storage.entriesMap.set(this.path.toString(), entry)
		return true
	}

	public readonly read = (): InMemoryFsDbEntry | undefined => {
		return this.storage.entriesMap.get(this.path.toString())
	}

	public readonly delete = (): boolean => {
		return this.storage.entriesMap.delete(this.path.toString())
	}

	public readonly deleteAllChildren = () => {
		const prefix = this.path.toString()
		// This is O(n) with respect to the number of entries in the map, since
		// JavaScript's Map does not support efficient prefix-based operations. For
		// better performance with large datasets, consider using a trie (prefix tree)
		// or a sorted map that supports range queries for prefix deletion.
		for (const key of this.storage.entriesMap.keys()) {
			if (key.startsWith(prefix)) {
				this.storage.entriesMap.delete(key)
			}
		}
	}
}
