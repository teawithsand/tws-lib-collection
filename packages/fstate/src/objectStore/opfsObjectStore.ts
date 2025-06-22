import type { SerializerReverse } from "@teawithsand/reserd"
import type { ObjectStore } from "./objectStore"

/**
 * OPFS-based implementation of ObjectStore (non-atomic).
 */
export class OpfsObjectStore<Header> implements ObjectStore<Header> {
	private folder
	private headerSerializer

	constructor({
		folder,
		headerSerializer,
	}: {
		folder: FileSystemDirectoryHandle
		headerSerializer: SerializerReverse<Header, ArrayBuffer | Blob>
	}) {
		this.folder = folder
		this.headerSerializer = headerSerializer
	}

	public readonly getBlob = async (key: string): Promise<Blob | null> => {
		try {
			const dir = await this.folder.getDirectoryHandle(key)
			const fileHandle = await dir.getFileHandle("blob")
			const file = await fileHandle.getFile()
			return file
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError")
				return null
			throw e
		}
	}

	public readonly setBlob = async (
		key: string,
		blob: Blob | null,
	): Promise<void> => {
		const dir = await this.folder.getDirectoryHandle(key, { create: true })
		if (blob === null) {
			try {
				await dir.removeEntry("blob")
			} catch (e) {
				if (!(e instanceof DOMException && e.name === "NotFoundError"))
					throw e
			}
			// Check if header exists by trying to get the file handle
			let headerExists = false
			try {
				await dir.getFileHandle("header")
				headerExists = true
			} catch (e) {
				if (!(e instanceof DOMException && e.name === "NotFoundError"))
					throw e
			}
			if (!headerExists) {
				await this.folder.removeEntry(key, { recursive: true })
			}
			return
		}
		const fileHandle = await dir.getFileHandle("blob", { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(blob)
		await writable.close()
	}

	public readonly getHeader = async (key: string): Promise<Header | null> => {
		try {
			const dir = await this.folder.getDirectoryHandle(key)
			const fileHandle = await dir.getFileHandle("header")
			const file = await fileHandle.getFile()
			return this.headerSerializer.deserialize(file)
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError")
				return null
			throw e
		}
	}

	public readonly setHeader = async (
		key: string,
		header: Header | null,
	): Promise<void> => {
		const dir = await this.folder.getDirectoryHandle(key, { create: true })
		if (header === null) {
			try {
				await dir.removeEntry("header")
			} catch (e) {
				if (!(e instanceof DOMException && e.name === "NotFoundError"))
					throw e
			}
			// Check if blob exists by trying to get the file handle
			let blobExists = false
			try {
				await dir.getFileHandle("blob")
				blobExists = true
			} catch (e) {
				if (!(e instanceof DOMException && e.name === "NotFoundError"))
					throw e
			}
			if (!blobExists) {
				await this.folder.removeEntry(key, { recursive: true })
			}
			return
		}
		const fileHandle = await dir.getFileHandle("header", { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(this.headerSerializer.serialize(header))
		await writable.close()
	}

	public readonly getKeys = async (prefix: string): Promise<string[]> => {
		const keys: string[] = []
		for await (const entry of this.folder.values()) {
			if (entry.kind === "directory" && entry.name.startsWith(prefix)) {
				keys.push(entry.name)
			}
		}
		return keys
	}

	public readonly clear = async (): Promise<void> => {
		for await (const entry of this.folder.values()) {
			await this.folder.removeEntry(entry.name, { recursive: true })
		}
	}
}
