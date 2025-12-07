import { FsDirHandle, FsWriteMode, Path } from "@teawithsand/fstate"
import { FileManagerUploadOperationError } from "../error"

const validateFileName = (fileName: string): Path => {
	const path = Path.parse(fileName)
	if (path.getSegments().length === 0) {
		throw new FileManagerUploadOperationError("File name cannot be empty")
	}
	return path
}

/**
 * Writes blob to directory in chunks, invoking callbacks for progress and interruption checks.
 */
export const writeBlobToDirectoryChunked = async (
	outputDir: FsDirHandle,
	fileName: string,
	blob: Blob,
	chunkSize: number,
	onChunkWritten: (bytes: number) => void,
	checkInterruption: () => void,
): Promise<void> => {
	const path = validateFileName(fileName)
	if (chunkSize <= 0) {
		throw new FileManagerUploadOperationError("Chunk size must be positive")
	}

	const outputFile = await outputDir.openFile(path, {
		create: true,
		createMissingDirs: true,
	})

	const writer = await outputFile.write({ mode: FsWriteMode.OVERWRITE })

	try {
		let offset = 0
		const total = blob.size ?? 0
		while (offset < total) {
			checkInterruption()
			const nextOffset = Math.min(offset + chunkSize, total)
			const chunk = blob.slice(offset, nextOffset)
			await writer.write(chunk)
			onChunkWritten(chunk.size)
			offset = nextOffset
		}
		// Handle empty blob: still ensure file exists even if no chunks
		if (total === 0) {
			checkInterruption()
			onChunkWritten(0)
		}
	} finally {
		await writer.close()
	}
}
