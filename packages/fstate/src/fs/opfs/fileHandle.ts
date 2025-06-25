import { FsHandleType } from "../defines/baseHandle"
import { FsErrorNotFound } from "../defines/error"
import {
	FileStatResult,
	FsFileHandle,
	FsFileOpenMode,
} from "../defines/fileHandle"
import { Path } from "../defines/path"
import { FsWriter, FsWriteSettings } from "../defines/writer"
import { OpfsErrorUtil } from "./opfsError"
import { OpfsFsWriter } from "./opfsFsWriter"

/**
 * Not Implemented Yet (NIY) OPFS file handle implementation.
 */
export class OpfsFileHandle implements FsFileHandle {
	public readonly type = FsHandleType.FILE
	public readonly path: Path
	public readonly name: string
	public readonly openMode: FsFileOpenMode

	public constructor(
		private readonly parentHandle: FileSystemDirectoryHandle,
		private readonly handle: FileSystemFileHandle,
		path: Path,
		openMode: FsFileOpenMode,
	) {
		this.path = path
		this.name = path.basename() ?? ""
		this.openMode = openMode
	}

	/**
	 * Checks if the file exists in the parent directory.
	 * @returns {Promise<boolean>} True if the file exists, false otherwise.
	 */
	public readonly exists = async (): Promise<boolean> => {
		try {
			await this.parentHandle.getFileHandle(this.name, { create: false })
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return false
			}
			throw OpfsErrorUtil.convertToFsError(
				e,
				"Failed to check file existence",
			)
		}
		return true
	}

	public readonly getFile = async (): Promise<File> => {
		try {
			return await this.handle.getFile()
		} catch (error) {
			throw OpfsErrorUtil.convertToFsError(error, "Failed to get file")
		}
	}

	public readonly getFileOrNull = async (): Promise<File | null> => {
		try {
			return await this.handle.getFile()
		} catch (error) {
			if (OpfsErrorUtil.isNotFoundError(error)) {
				return null
			}
			throw OpfsErrorUtil.convertToFsError(error, "Failed to get file")
		}
	}

	/**
	 * Deletes the file from the parent directory.
	 * @returns {Promise<void>}
	 */
	public readonly delete = async (): Promise<void> => {
		try {
			await this.parentHandle.removeEntry(this.name)
		} catch (e) {
			if (e instanceof DOMException && e.name === "NotFoundError") {
				return
			}
			throw OpfsErrorUtil.convertToFsError(e, "Failed to delete file")
		}
	}

	public readonly stat = async (): Promise<FileStatResult> => {
		if (this.parentHandle) {
			try {
				await this.parentHandle.getFileHandle(this.name, {
					create: false,
				})
			} catch (e) {
				if (OpfsErrorUtil.isNotFoundError(e)) {
					return {
						exists: false,
						size: 0,
					}
				}
				throw OpfsErrorUtil.convertToFsError(
					e,
					"Failed to stat file existence via parent",
				)
			}
		}

		let file: File
		try {
			file = await this.handle.getFile()
		} catch (e) {
			if (OpfsErrorUtil.isNotFoundError(e)) {
				return {
					exists: false,
					size: 0,
				}
			}
			throw OpfsErrorUtil.convertToFsError(e, "Failed to stat file")
		}

		return {
			exists: true,
			size: file.size,
		}
	}

	public readonly write = async (
		options?: FsWriteSettings,
	): Promise<FsWriter> => {
		return await OpfsFsWriter.fromFileHandle(this.handle, options)
	}
}
