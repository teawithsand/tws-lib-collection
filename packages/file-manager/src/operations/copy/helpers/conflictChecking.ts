import {
	FsDirHandle,
	FsErrorAlreadyExists,
	FsErrorNotFound,
	FsFileHandle,
	Path,
} from "@teawithsand/fstate"
import { CopyOperationConflictResolver } from "../defines"
import { FileManagerCopyConflictError } from "../error"
import {
	resolveDirectoryFileConflict,
	resolveFileDirConflict,
	resolveFileFileConflict,
} from "./conflictResolution"

export const checkFileConflict = async (
	fileHandle: FsFileHandle,
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<Path | null | undefined> => {
	try {
		const existingFile = await outputDir.openFile(relativePath)
		const fileStat = await existingFile.stat()

		if (fileStat.exists) {
			const resolutionPath = await resolveFileFileConflict(
				fileHandle,
				existingFile,
				relativePath,
				conflictResolver,
			)

			if (
				resolutionPath !== null &&
				!pathsEqual(resolutionPath, relativePath) &&
				(await pathExists(outputDir, resolutionPath))
			) {
				throw new FileManagerCopyConflictError(
					`Cannot rename to ${resolutionPath.toString()}: target already exists`,
				)
			}

			return resolutionPath
		}
	} catch (error) {
		if (!(error instanceof FsErrorNotFound)) {
			throw error
		}
	}
	return undefined
}

export const checkDirectoryConflict = async (
	fileHandle: FsFileHandle,
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<Path | null | undefined> => {
	try {
		const existingDir = await outputDir.openDir(relativePath)
		const dirStat = await existingDir.stat()

		if (dirStat.exists) {
			const resolutionPath = await resolveFileDirConflict(
				fileHandle,
				existingDir,
				relativePath,
				conflictResolver,
			)

			if (
				resolutionPath !== null &&
				!pathsEqual(resolutionPath, relativePath) &&
				(await pathExists(outputDir, resolutionPath))
			) {
				throw new FileManagerCopyConflictError(
					`Cannot rename to ${resolutionPath.toString()}: target already exists`,
				)
			}

			return resolutionPath
		}
	} catch (error) {
		if (!(error instanceof FsErrorNotFound)) {
			throw error
		}
	}
	return undefined
}

export const handleDirectoryConflict = async (
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<{ shouldCreate: boolean; skipped: boolean }> => {
	try {
		const existingFile = await outputDir.openFile(relativePath)
		const fileStat = await existingFile.stat()
		if (fileStat.exists) {
			const resolution = await resolveDirectoryFileConflict(
				existingFile,
				relativePath,
				conflictResolver,
			)

			// SKIP -> do not create, but treat as processed
			if (resolution === false) {
				return { shouldCreate: false, skipped: true }
			}
		}
	} catch (error) {
		if (error instanceof FsErrorNotFound) {
			// No file at target path, safe to proceed
			try {
				const existingDir = await outputDir.openDir(relativePath)
				const dirStat = await existingDir.stat()
				if (dirStat.exists) {
					// Directory already there, skip creation but count as processed(not skipped)
					return { shouldCreate: false, skipped: false }
				}
			} catch (dirError) {
				if (!(dirError instanceof FsErrorNotFound)) {
					throw dirError
				}
			}
			return { shouldCreate: true, skipped: false }
		}

		// Directory exists at path (in-memory throws generic Error) or other already-exists case
		if (
			error instanceof FsErrorAlreadyExists ||
			(error instanceof Error &&
				error.message.includes("path exists as directory"))
		) {
			return { shouldCreate: false, skipped: false }
		}

		throw error
	}

	return { shouldCreate: true, skipped: false }
}

export const resolveFileOutputPath = async (
	fileHandle: FsFileHandle,
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<Path | null> => {
	const fileConflictPath = await checkFileConflict(
		fileHandle,
		outputDir,
		relativePath,
		conflictResolver,
	)
	if (fileConflictPath !== undefined) {
		return fileConflictPath
	}

	const dirConflictPath = await checkDirectoryConflict(
		fileHandle,
		outputDir,
		relativePath,
		conflictResolver,
	)
	if (dirConflictPath !== undefined) {
		return dirConflictPath
	}

	return relativePath
}

const pathExists = async (
	outputDir: FsDirHandle,
	path: Path,
): Promise<boolean> => {
	try {
		const file = await outputDir.openFile(path)
		const stat = await file.stat()
		if (stat.exists) {
			return true
		}
	} catch (error) {
		if (error instanceof FsErrorNotFound) {
			// fall through to directory check
		} else if (
			error instanceof FsErrorAlreadyExists ||
			(error instanceof Error &&
				error.message.includes("path exists as directory"))
		) {
			return true
		} else {
			throw error
		}
	}

	try {
		const dir = await outputDir.openDir(path)
		const stat = await dir.stat()
		return stat.exists
	} catch (error) {
		if (error instanceof FsErrorNotFound) {
			return false
		}
		throw error
	}
}

const pathsEqual = (left: Path, right: Path): boolean =>
	left.toString() === right.toString()
