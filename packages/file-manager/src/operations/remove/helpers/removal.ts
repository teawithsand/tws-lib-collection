import { FsDirHandle, FsFileHandle, FsHandle } from "@teawithsand/fstate"
import { FileManagerRemoveOperationError } from "../error"

export const removeFile = async (
	fileHandle: FsFileHandle,
	updateCurrentHandle: (handle: FsHandle) => void,
	clearCurrentHandle: () => void,
	incrementFilesRemoved: () => void,
	incrementFilesSkipped: () => void,
): Promise<void> => {
	updateCurrentHandle(fileHandle)
	const stat = await fileHandle.stat()

	if (!stat.exists) {
		incrementFilesSkipped()
		clearCurrentHandle()
		return
	}

	await fileHandle.delete()
	incrementFilesRemoved()
	clearCurrentHandle()
}

export const removeDirectory = async (
	dirHandle: FsDirHandle,
	updateCurrentHandle: (handle: FsHandle) => void,
	clearCurrentHandle: () => void,
	incrementDirsRemoved: () => void,
	incrementDirsSkipped: () => void,
): Promise<void> => {
	updateCurrentHandle(dirHandle)
	const stat = await dirHandle.stat()

	if (!stat.exists) {
		incrementDirsSkipped()
		clearCurrentHandle()
		return
	}

	try {
		await dirHandle.delete(false)
	} catch {
		throw new FileManagerRemoveOperationError(
			"Failed to delete directory during remove operation",
		)
	}

	incrementDirsRemoved()
	clearCurrentHandle()
}
