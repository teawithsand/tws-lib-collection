import { FsDirHandle, FsFileHandle, Path } from "@teawithsand/fstate"
import {
	FileAlreadyExistConflictResolution,
	FileAlreadyExistConflictResolutionType,
} from "../../conflict"
import { CopyOperationConflictResolver } from "../defines"
import { FileManagerCopyConflictError } from "../error"

export const applyFileConflictResolution = (
	resolution: FileAlreadyExistConflictResolution,
	relativePath: Path,
): Path | null => {
	if (resolution.type === FileAlreadyExistConflictResolutionType.ERROR) {
		throw new FileManagerCopyConflictError(
			`File already exists at ${relativePath.toString()}`,
		)
	}

	if (resolution.type === FileAlreadyExistConflictResolutionType.SKIP) {
		return null
	}

	if (resolution.type === FileAlreadyExistConflictResolutionType.RENAME) {
		return computeRenamedPath(relativePath, resolution.newFileName)
	}

	// OVERWRITE: proceed with original path
	return relativePath
}

export const resolveFileFileConflict = async (
	fileHandle: FsFileHandle,
	existingFile: FsFileHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<Path | null> => {
	const resolution = await conflictResolver.resolveFileAlreadyExistConflict(
		fileHandle,
		existingFile,
	)

	return applyFileConflictResolution(resolution, relativePath)
}

export const resolveFileDirConflict = async (
	fileHandle: FsFileHandle,
	existingDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<Path | null> => {
	const resolution = await conflictResolver.resolveFileAlreadyExistConflict(
		fileHandle,
		existingDir,
	)

	if (resolution.type === FileAlreadyExistConflictResolutionType.OVERWRITE) {
		throw new FileManagerCopyConflictError(
			`Cannot overwrite directory at ${relativePath.toString()} with file`,
		)
	}

	if (resolution.type === FileAlreadyExistConflictResolutionType.ERROR) {
		throw new FileManagerCopyConflictError(
			`Cannot create file at ${relativePath.toString()}: directory already exists`,
		)
	}

	if (resolution.type === FileAlreadyExistConflictResolutionType.SKIP) {
		return null
	}

	// RENAME - type guard ensures resolution has newFileName
	if (resolution.type === FileAlreadyExistConflictResolutionType.RENAME) {
		return computeRenamedPath(relativePath, resolution.newFileName)
	}

	// Should never reach here
	throw new FileManagerCopyConflictError(
		`Unsupported resolution type for directory conflict`,
	)
}

export const resolveDirectoryFileConflict = async (
	existingFile: FsFileHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
): Promise<false | void> => {
	const resolution = await conflictResolver.resolveFileAlreadyExistConflict(
		existingFile,
		existingFile,
	)

	if (resolution.type === FileAlreadyExistConflictResolutionType.ERROR) {
		throw new FileManagerCopyConflictError(
			`Cannot create directory at ${relativePath.toString()}: file already exists`,
		)
	}

	if (resolution.type === FileAlreadyExistConflictResolutionType.SKIP) {
		return false
	}

	// OVERWRITE and RENAME not supported for directory conflicts
	throw new FileManagerCopyConflictError(
		`Cannot create directory at ${relativePath.toString()}: unsupported resolution type`,
	)
}

export const computeRenamedPath = (
	relativePath: Path,
	newFileName: string,
): Path => {
	const parentPath = relativePath.parent()
	if (parentPath === null) {
		return Path.fromSegment(newFileName)
	}
	return parentPath.concat(Path.fromSegment(newFileName))
}
