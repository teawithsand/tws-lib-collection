import { FsHandleType } from "../defines/baseHandle"
import { FsErrorNotFound } from "../defines/error"
import {
	FileStatResult,
	FsFileHandle,
	FsFileOpenMode,
} from "../defines/fileHandle"
import { Path } from "../defines/path"
import type { FsWriteSettings, FsWriter } from "../defines/writer"
import { FsWriteMode } from "../defines/writer"
import { IndexedDbFsDb, IndexedDbFsDbHandle } from "./database"

/**
 * IndexedDB implementation of FsFileHandle for persistent browser storage.
 */
export class IndexedDbFileHandle implements FsFileHandle {
	public readonly type = FsHandleType.FILE
	public readonly name: string
	public readonly path: Path
	public readonly openMode: FsFileOpenMode

	private readonly db: IndexedDbFsDb
	private readonly handle: IndexedDbFsDbHandle
	private readonly activeWriters = new Set<string>()

	public constructor(
		db: IndexedDbFsDb,
		path: Path,
		openMode: FsFileOpenMode = FsFileOpenMode.READ_WRITE,
	) {
		this.db = db
		this.handle = db.getHandle(path)
		this.name = this.handle.name
		this.path = this.handle.getPath()
		this.openMode = openMode
	}

	public readonly exists = async (): Promise<boolean> => {
		const entry = await this.handle.read()
		return !!entry && entry.type === FsHandleType.FILE
	}

	public readonly getFile = async (): Promise<File> => {
		const entry = await this.handle.read()
		if (!entry || entry.type !== FsHandleType.FILE) {
			throw new FsErrorNotFound("File does not exist.")
		}
		// IndexedDB Blob to File conversion for compatibility
		return new File([entry.content], this.name)
	}

	public readonly getFileOrNull = async (): Promise<File | null> => {
		const entry = await this.handle.read()
		if (!entry || entry.type !== FsHandleType.FILE) {
			return null
		}
		// IndexedDB Blob to File conversion for compatibility
		return new File([entry.content], this.name)
	}

	public readonly delete = async (): Promise<void> => {
		if (this.activeWriters.size > 0) {
			throw new Error("Cannot delete file while there are active writers")
		}
		await this.handle.delete()
	}

	public readonly stat = async (): Promise<FileStatResult> => {
		// First check if the handle path is still valid (all parents exist)
		if (!(await this.isHandleValid())) {
			return { exists: false, size: 0 }
		}

		const entry = await this.handle.read()
		if (!entry) {
			return { exists: false, size: 0 }
		}
		if (entry.type !== FsHandleType.FILE) {
			throw new Error(
				"Handle is invalid: target was recreated as a different type",
			)
		}
		return { exists: true, size: entry.content.size }
	}

	public readonly write = async (
		settings?: FsWriteSettings,
	): Promise<FsWriter> => {
		// Create file if it doesn't exist
		const currentEntry = await this.handle.read()
		if (!currentEntry) {
			await this.handle.writeForce({
				type: FsHandleType.FILE,
				content: new Blob([]),
			})
		}

		const handle = this.handle
		const writerId = Math.random().toString(36)
		this.activeWriters.add(writerId)

		const writeMode = settings?.mode ?? FsWriteMode.OVERWRITE
		const buffers: (ArrayBuffer | Blob)[] = []

		// Capture the current content at writer creation time for append mode
		let initialContent: Blob | null = null
		if (writeMode === FsWriteMode.APPEND) {
			const entry = await handle.read()
			if (entry && entry.type === FsHandleType.FILE) {
				initialContent = entry.content
			}
		}

		return {
			write: async (data: ArrayBuffer | Blob): Promise<void> => {
				buffers.push(data)
			},
			close: async (): Promise<void> => {
				this.activeWriters.delete(writerId)

				// Build content based on write mode
				const contentParts: (Blob | ArrayBuffer)[] = []

				if (writeMode === FsWriteMode.APPEND && initialContent) {
					contentParts.push(initialContent)
				}

				// Add the buffered content
				contentParts.push(...buffers)

				const newContent = new Blob(contentParts)
				await handle.writeForce({
					type: FsHandleType.FILE,
					content: newContent,
				})
			},
		}
	}

	/**
	 * Checks if the handle path is still valid (all parent directories exist).
	 */
	private readonly isHandleValid = async (): Promise<boolean> => {
		const pathSegments = this.path.getSegments()
		// Check only parent directories, not the current file itself
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const parentPath = new Path(pathSegments.slice(0, i + 1).join("/"))
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = await parentHandle.read()
			if (!parentEntry || parentEntry.type !== FsHandleType.DIR) {
				return false
			}
		}
		return true
	}
}
