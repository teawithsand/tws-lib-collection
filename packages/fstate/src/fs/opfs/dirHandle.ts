import { FsHandleType } from "../defines/baseHandle"
import {
	DirStatResult,
	FsDirHandle,
	FsDirOpenOrNullSettings,
	FsDirOpenSettings,
	FsFileOpenOrNullSettings,
	FsFileOpenSettings,
} from "../defines/dirHandle"
import { FsErrorBadPath } from "../defines/error"
import { FsFileHandle, FsFileOpenMode } from "../defines/fileHandle"
import { Path } from "../defines/path"
import { OpfsFileHandle } from "./fileHandle"
import { OpfsErrorUtil } from "./opfsError"

/**
 * Not Implemented Yet (NIY) OPFS directory handle implementation.
 */
export class OpfsDirHandle implements FsDirHandle {
	public readonly type = FsHandleType.DIR
	public readonly path: Path
	public readonly name: string

	public constructor(
		private readonly parentHandle: FileSystemDirectoryHandle | null,
		private readonly handle: FileSystemDirectoryHandle,
		path: Path,
	) {
		this.path = path
		this.name = path.basename() ?? ""
	}

	public readonly exists = async (): Promise<boolean> => {
		if (!this.parentHandle) return true // Root directory always exists

		try {
			await this.parentHandle.getDirectoryHandle(this.name, {
				create: false,
			})
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return false
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to check directory existence",
			)
		}

		return true
	}

	public readonly stat = async (): Promise<DirStatResult> => {
		if (this.parentHandle) {
			try {
				await this.parentHandle.getDirectoryHandle(this.name, {
					create: false,
				})
			} catch (e) {
				if (OpfsErrorUtil.isNotFoundError(e)) {
					return {
						exists: false,
						entries: [],
					}
				}
				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to stat directory existence via parent",
				)
			}
		}

		const res: FileSystemHandle[] = []
		try {
			for await (const [, e] of this.handle.entries()) {
				res.push(e)
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return {
					exists: false,
					entries: [],
				}
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to stat directory entries",
			)
		}

		return {
			exists: true,
			entries: res.map((handle) => {
				// TODO(teawithsand): test case when handle.name is funky name like .. or .
				if (handle.kind === "file") {
					return new OpfsFileHandle(
						this.handle,
						handle as FileSystemFileHandle,
						this.path.concat(Path.parse(handle.name)),
						FsFileOpenMode.READ,
					)
				} else if (handle.kind === "directory") {
					return new OpfsDirHandle(
						this.handle,
						handle as FileSystemDirectoryHandle,
						this.path.concat(Path.parse(handle.name)),
					)
				} else {
					throw new Error(`Unknown handle kind: ${handle.kind}`)
				}
			}),
		}
	}

	public readonly delete = async (recursive: boolean): Promise<void> => {
		if (!this.parentHandle) {
			// Root directory: clear all entries recursively, throw if not empty and recursive is false
			const entries = []
			for await (const [, entry] of this.handle.entries()) {
				entries.push(entry)
			}
			if (!recursive && entries.length > 0) {
				throw new Error(
					"Cannot delete root directory: not empty and recursive is false",
				)
			}
			for (const entry of entries) {
				if (entry.kind === "file") {
					await this.handle.removeEntry(entry.name)
				} else if (entry.kind === "directory") {
					await this.handle.removeEntry(entry.name, {
						recursive: true,
					})
				}
			}
			return
		}

		try {
			await this.parentHandle.removeEntry(this.name, {
				recursive: recursive,
			})
		} catch (e) {
			// NotFoundError: already deleted
			// InvalidModificationError: will be thrown if recursive is false and directory is not empty
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to delete directory",
			)
		}
	}

	public readonly openFile = async (
		path: Path,
		settings?: FsFileOpenSettings,
	): Promise<FsFileHandle> => {
		// Check for empty path - cannot open file with empty path
		if (path.getSegments().length === 0) {
			throw new FsErrorBadPath("Cannot open file with empty path")
		}

		let target: FileSystemDirectoryHandle = this.handle

		const segments = path.getSegments().slice(0, -1)
		const basename = path.basename() ?? ""
		for (const pathSegment of segments) {
			target = await target.getDirectoryHandle(pathSegment, {
				create: settings?.createMissingDirs ?? false,
			})
		}

		if (!settings?.allowExisting && settings?.allowExisting !== undefined) {
			try {
				await target.getFileHandle(basename, {
					create: false,
				})
			} catch (e) {
				if (e instanceof DOMException && e.name === "NotFoundError") {
					// noop
				}

				throw e
			}
		}

		const res = await target
			.getFileHandle(basename, {
				create: settings?.create ?? false,
			})
			.catch((e) => {
				throw OpfsErrorUtil.convertToFsError(e, "Failed to open file")
			})

		return new OpfsFileHandle(
			target,
			res,
			this.path.concat(path),
			settings?.openMode ?? FsFileOpenMode.READ_WRITE,
		)
	}

	public readonly openFileOrNull = async (
		path: Path,
		settings?: FsFileOpenOrNullSettings,
	): Promise<FsFileHandle | null> => {
		let target: FileSystemDirectoryHandle = this.handle

		const segments = path.getSegments().slice(0, -1)
		const basename = path.basename() ?? ""

		for (const pathSegment of segments) {
			try {
				target = await target.getDirectoryHandle(pathSegment, {
					create: false,
				})
			} catch (e) {
				if (
					settings?.allowMissingParentDirectories &&
					e instanceof DOMException &&
					e.name === "NotFoundError"
				) {
					return null
				}
				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to open file or null",
				)
			}
		}

		try {
			const res = await target.getFileHandle(basename, {
				create: false,
			})

			return new OpfsFileHandle(
				target,
				res,
				this.path.concat(path),
				FsFileOpenMode.READ,
			)
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return null
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to open file or null",
			)
		}
	}

	public readonly openDir = async (
		path: Path,
		settings?: FsDirOpenSettings,
	): Promise<FsDirHandle> => {
		let target: FileSystemDirectoryHandle = this.handle

		if (path.basename() === null) {
			return this
		}

		const segments = path.getSegments()
		const basename = path.basename() ?? ""
		for (const pathSegment of segments.slice(0, -1)) {
			target = await target.getDirectoryHandle(pathSegment, {
				create: settings?.createMissingDirs ?? false,
			})
		}

		if (!settings?.allowExisting && settings?.allowExisting !== undefined) {
			try {
				await target.getDirectoryHandle(basename, {
					create: false,
				})
			} catch (e) {
				if (e instanceof DOMException && e.name === "NotFoundError") {
					// noop
				}

				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to open directory",
				)
			}
		}

		const res = await target
			.getDirectoryHandle(basename, {
				create: settings?.create ?? false,
			})
			.catch((e) => {
				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to open directory",
				)
			})

		return new OpfsDirHandle(target, res, this.path.concat(path))
	}

	public readonly openDirOrNull = async (
		path: Path,
		settings?: FsDirOpenOrNullSettings,
	): Promise<FsDirHandle | null> => {
		let target: FileSystemDirectoryHandle = this.handle

		const segments = path.getSegments()
		const basename = path.basename() ?? ""

		for (const pathSegment of segments.slice(0, -1)) {
			try {
				target = await target.getDirectoryHandle(pathSegment, {
					create: false,
				})
			} catch (e) {
				if (
					settings?.allowMissingParentDirectories &&
					e instanceof DOMException &&
					e.name === "NotFoundError"
				) {
					return null
				}
				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to open directory or null",
				)
			}
		}

		try {
			const res = await target.getDirectoryHandle(basename, {
				create: false,
			})

			return new OpfsDirHandle(target, res, this.path.concat(path))
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return null
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to open directory or null",
			)
		}
	}
}
