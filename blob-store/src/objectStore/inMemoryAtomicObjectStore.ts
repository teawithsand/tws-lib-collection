import { AtomicObjectStore, ObjectStoreTuple } from "./objectStore"

/**
 * In-memory implementation of AtomicObjectStore using two Maps.
 * Stores blobs and headers separately in memory.
 */
export class InMemoryAtomicObjectStore<Header>
	implements AtomicObjectStore<Header>
{
	private readonly blobMap = new Map<string, Blob | null>()
	private readonly headerMap = new Map<string, Header | null>()

	public readonly getBlob = async (key: string): Promise<Blob | null> => {
		return this.blobMap.has(key) ? (this.blobMap.get(key) ?? null) : null
	}

	public readonly setBlob = async (
		key: string,
		blob: Blob | null,
	): Promise<void> => {
		if (blob === null) {
			this.blobMap.delete(key)
		} else {
			this.blobMap.set(key, blob)
		}
	}

	public readonly getHeader = async (key: string): Promise<Header | null> => {
		return this.headerMap.has(key)
			? (this.headerMap.get(key) ?? null)
			: null
	}

	public readonly setHeader = async (
		key: string,
		header: Header | null,
	): Promise<void> => {
		if (header === null) {
			this.headerMap.delete(key)
		} else {
			this.headerMap.set(key, header)
		}
	}

	public readonly get = async (
		key: string,
	): Promise<ObjectStoreTuple<Header>> => {
		return {
			blob: await this.getBlob(key),
			header: await this.getHeader(key),
		}
	}

	public readonly delete = async (key: string): Promise<void> => {
		this.blobMap.delete(key)
		this.headerMap.delete(key)
	}

	public readonly set = async (
		key: string,
		blob: Blob | null,
		header: Header | null,
	): Promise<void> => {
		await this.setBlob(key, blob)
		await this.setHeader(key, header)
	}

	/**
	 * Returns all keys in the store that start with the given prefix.
	 * @param prefix - The prefix to match keys against.
	 * @returns Promise resolving to an array of matching keys.
	 */
	public readonly getKeys = async (prefix: string): Promise<string[]> => {
		const keys = new Set<string>()
		for (const key of this.blobMap.keys()) {
			if (key.startsWith(prefix)) keys.add(key)
		}
		for (const key of this.headerMap.keys()) {
			if (key.startsWith(prefix)) keys.add(key)
		}
		return Array.from(keys)
	}

	public readonly clear = async (): Promise<void> => {
		this.blobMap.clear()
		this.headerMap.clear()
	}
}
