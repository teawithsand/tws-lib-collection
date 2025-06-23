import { FsErrorBadType } from "../defines/error"
import { FileHandle } from "../defines/fileHandle"
import { FileStatResult } from "../defines/fileStatResult"
import { Path } from "../defines/path"
import { FsWriteOptions, FsWriter } from "../defines/writer"
import { OpfsErrorUtil } from "./opfsErrorUtil"
import { OpfsFsWriter } from "./opfsFsWriter.js"

/**
 * OPFS implementation of FileHandle.
 */
export class OpfsFileHandle implements FileHandle {
	private readonly fileHandle: FileSystemFileHandle
	private readonly filePath: Path

	public constructor({
		fileHandle,
		filePath,
	}: {
		fileHandle: FileSystemFileHandle
		filePath: Path
	}) {
		this.fileHandle = fileHandle
		this.filePath = filePath
	}

	/**
	 * Name of the handle (basename of the path).
	 */
	public get name(): string {
		return this.filePath.basename() ?? ""
	}

	/**
	 * Path of the handle as a Path class instance.
	 */
	public get path(): Path {
		return this.filePath
	}

	/**
	 * Checks if the file exists.
	 */
	public readonly exists = async (): Promise<boolean> => {
		try {
			// Try to get the file to check if it exists
			await this.fileHandle.getFile()
			return true
		} catch {
			return false
		}
	}

	/**
	 * Reads the entire file as a Uint8Array.
	 */
	public readonly read = async (): Promise<Uint8Array> => {
		return await OpfsErrorUtil.wrapOperation(async () => {
			const file = await this.fileHandle.getFile()
			const arrayBuffer = await file.arrayBuffer()
			return new Uint8Array(arrayBuffer)
		}, `Reading file: ${this.filePath.toString()}`)
	}

	/**
	 * Gets a File object representing the file.
	 */
	public readonly getFile = async (): Promise<File> => {
		return await OpfsErrorUtil.wrapOperation(async () => {
			return await this.fileHandle.getFile()
		}, `Getting file: ${this.filePath.toString()}`)
	}

	/**
	 * Deletes the file.
	 */
	public readonly delete = async (): Promise<void> => {
		// To delete a file, we need to remove it from its parent directory
		// Since we only have the file handle, we need to derive parent information
		const pathSegments = this.filePath.getSegments()
		if (pathSegments.length === 0) {
			throw new FsErrorBadType("Cannot delete file with empty path")
		}

		// For OPFS, we need access to the parent directory handle to remove the file
		// This is a limitation of the current design - we'd need to store parent reference
		// For now, we'll throw an error indicating this operation is not supported directly
		throw new FsErrorBadType(
			"File deletion requires parent directory handle - use directory.removeEntry() instead",
		)
	}

	/**
	 * Gets stat info for the file.
	 */
	public readonly stat = async (): Promise<FileStatResult> => {
		try {
			const file = await this.fileHandle.getFile()
			return {
				exists: true,
				size: file.size,
			}
		} catch {
			return { exists: false }
		}
	}

	/**
	 * Writes contents to this file.
	 *
	 * @param options Write options.
	 * @returns Writer for writing to the file.
	 */
	public readonly write = async (
		options?: FsWriteOptions,
	): Promise<FsWriter> => {
		return await OpfsErrorUtil.wrapOperation(async () => {
			// Verify the file exists by trying to access it
			await this.fileHandle.getFile()

			const writerParams: {
				fileHandle: FileSystemFileHandle
				options?: FsWriteOptions
			} = {
				fileHandle: this.fileHandle,
			}
			if (options) {
				writerParams.options = options
			}

			return new OpfsFsWriter(writerParams)
		}, `Writing to file: ${this.filePath.toString()}`)
	}
}
