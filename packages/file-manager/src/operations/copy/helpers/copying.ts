import {
	FsDirHandle,
	FsFileHandle,
	FsWriteMode,
	Path,
} from "@teawithsand/fstate"
import { CopyOperationConflictResolver } from "../defines"
import {
	handleDirectoryConflict,
	resolveFileOutputPath,
} from "./conflictChecking"

export const copyFile = async (
	fileHandle: FsFileHandle,
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
	updateCurrentFile: (fileHandle: FsFileHandle) => void,
	updateFileProgress: (bytesCopied: number) => void,
	incrementFilesSkipped: () => void,
): Promise<void> => {
	updateCurrentFile(fileHandle)

	const file = await fileHandle.getFile()
	const outputPath = await resolveFileOutputPath(
		fileHandle,
		outputDir,
		relativePath,
		conflictResolver,
	)

	if (outputPath === null) {
		// Conflict was resolved with SKIP
		incrementFilesSkipped()
		return
	}

	const outputFile = await outputDir.openFile(outputPath, {
		create: true,
		createMissingDirs: true,
	})

	await writeFileContent(file, outputFile)
	updateFileProgress(file.size)
}

export const copyDirectory = async (
	outputDir: FsDirHandle,
	relativePath: Path,
	conflictResolver: CopyOperationConflictResolver,
	incrementDirectoriesProcessed: () => void,
	incrementDirectoriesSkipped: () => void,
): Promise<void> => {
	const { shouldCreate, skipped } = await handleDirectoryConflict(
		outputDir,
		relativePath,
		conflictResolver,
	)

	if (skipped) {
		incrementDirectoriesSkipped()
	}

	if (shouldCreate) {
		await outputDir.openDir(relativePath, {
			create: true,
			createMissingDirs: true,
		})
	}

	incrementDirectoriesProcessed()
}

const writeFileContent = async (
	file: File,
	outputFile: FsFileHandle,
): Promise<void> => {
	const writer = await outputFile.write({
		mode: FsWriteMode.OVERWRITE,
	})

	try {
		await writer.write(file)
	} finally {
		await writer.close()
	}
}
