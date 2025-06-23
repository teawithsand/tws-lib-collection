import { FsHandleType } from "../defines/baseHandle"
import {
	FileStatResult,
	FsFileHandle,
	FsFileOpenMode,
} from "../defines/fileHandle"
import { Path } from "../defines/path"
import type { FsWriteSettings, FsWriter } from "../defines/writer"
import { InMemoryFsDb, InMemoryFsDbHandle } from "./database"

/**
 * In-memory implementation of FsFileHandle for testing and ephemeral storage.
 */
export class InMemoryFileHandle implements FsFileHandle {
	public readonly type = FsHandleType.FILE
	public readonly name: string
	public readonly path: Path
	public readonly openMode: FsFileOpenMode

	private readonly db: InMemoryFsDb
	private readonly handle: InMemoryFsDbHandle
	private readonly activeWriters = new Set<string>()

	public constructor(
		db: InMemoryFsDb,
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
		const entry = this.handle.read()
		return !!entry && entry.type === FsHandleType.FILE
	}

	public readonly getFile = async (): Promise<File> => {
		const entry = this.handle.read()
		if (!entry || entry.type !== FsHandleType.FILE) {
			throw new Error("File does not exist.")
		}
		// In-memory Blob to File conversion for test compatibility
		return new File([entry.content], this.name)
	}

	public readonly delete = async (): Promise<void> => {
		if (this.activeWriters.size > 0) {
			throw new Error("Cannot delete file while there are active writers")
		}
		this.handle.delete()
	}

	public readonly truncate = async (size: number): Promise<void> => {
		const entry = this.handle.read()
		if (!entry || entry.type !== FsHandleType.FILE) {
			throw new Error("File does not exist.")
		}
		const blob = entry.content
		const truncated = blob.slice(0, size)
		this.handle.writeThrowing({
			type: FsHandleType.FILE,
			content: truncated,
		})
	}

	public readonly stat = async (): Promise<FileStatResult> => {
		// First check if the handle path is still valid (all parents exist)
		if (!this.isHandleValid()) {
			return { exists: false, size: 0 }
		}

		const entry = this.handle.read()
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
		if (!this.handle.read()) {
			this.handle.writeForce({
				type: FsHandleType.FILE,
				content: new Blob([]),
			})
		}

		const handle = this.handle
		const writerId = Math.random().toString(36)
		this.activeWriters.add(writerId)
		let closed = false
		const checkValid = () => {
			if (closed) throw new Error("Writer is closed.")
			const entry = handle.read()
			if (!entry || entry.type !== FsHandleType.FILE) {
				throw new Error("File was deleted.")
			}
		}
		const mode = settings?.mode ?? "overwrite"

		// Buffer for writes until close
		let buffer: Blob | null = null
		return {
			write: async (data: Blob | ArrayBuffer) => {
				checkValid()
				if (buffer === null) {
					if (mode === "append") {
						const entry = handle.read()
						if (!entry || entry.type !== FsHandleType.FILE)
							throw new Error("File does not exist.")
						buffer = new Blob([entry.content, data])
					} else {
						buffer = new Blob([data])
					}
				} else {
					buffer = new Blob([buffer, data])
				}
			},
			close: async () => {
				checkValid()
				if (buffer !== null) {
					handle.writeThrowing({
						type: FsHandleType.FILE,
						content: buffer,
					})
				}
				closed = true
				this.activeWriters.delete(writerId)
			},
		}
	}

	/**
	 * Checks if this handle is still valid by verifying all parent directories exist.
	 */
	private readonly isHandleValid = (): boolean => {
		// Root directory is always valid if it exists
		if (this.path.toString() === "") {
			return true
		}

		// Check if all parent directories exist
		const pathSegments = this.path.getSegments()
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const parentPath = Path.from(pathSegments.slice(0, i + 1).join("/"))
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = parentHandle.read()
			if (!parentEntry || parentEntry.type !== FsHandleType.DIR) {
				return false
			}
		}
		return true
	}
}
