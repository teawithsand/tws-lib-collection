import { DirHandle } from "../defines/dirHandle"
import { DirOpenSettings } from "../defines/dirOpenSettings"
import { FsErrorAlreadyExists, FsErrorBadType } from "../defines/error"
import { FileHandle } from "../defines/fileHandle"
import { FileOpenSettings } from "../defines/fileOpenSettings"
import { FsEntry } from "../defines/fsEntry"
import { Path } from "../defines/path"
import { OpfsErrorUtil } from "./opfsErrorUtil"
import { OpfsFileHandle } from "./opfsFileHandle"

/**
 * OPFS implementation of DirHandle.
 */
export class OpfsDirHandle implements DirHandle {
	private readonly directoryHandle: FileSystemDirectoryHandle
	private readonly dirPath: Path
	private readonly rootHandle: FileSystemDirectoryHandle

	public constructor({
		directoryHandle,
		dirPath,
		rootHandle,
	}: {
		directoryHandle: FileSystemDirectoryHandle
		dirPath: Path
		rootHandle?: FileSystemDirectoryHandle
	}) {
		this.directoryHandle = directoryHandle
		this.dirPath = dirPath
		this.rootHandle = rootHandle ?? directoryHandle
	}

	/**
	 * Name of the handle (basename of the path).
	 */
	public get name(): string {
		return this.dirPath.basename() ?? ""
	}

	/**
	 * Path of the handle as a Path class instance.
	 */
	public get path(): Path {
		return this.dirPath
	}

	/**
	 * Checks if the directory exists.
	 */
	public readonly exists = async (): Promise<boolean> => {
		try {
			// Try to iterate over the directory handle - if successful, it exists
			// This approach works because the directoryHandle represents THIS directory
			for await (const _ of this.directoryHandle.entries()) {
				break // Just check if we can start iterating
			}
			return true
		} catch {
			return false
		}
	}

	/**
	 * Lists entries in the directory.
	 */
	public readonly list = async (): Promise<FsEntry[]> => {
		return await OpfsErrorUtil.wrapOperation(async () => {
			const entries: FsEntry[] = []

			for await (const [name, handle] of this.directoryHandle.entries()) {
				const isDirectory = handle.kind === "directory"
				entries.push({
					path: new Path(name),
					isDirectory,
					// OPFS doesn't provide lastModified easily, so we omit it
				})
			}

			return entries
		}, `Listing directory: ${this.dirPath.toString()}`)
	}

	/**
	 * Creates a subdirectory (recursive).
	 * @param name Name of the subdirectory.
	 */
	public readonly mkdir = async (name: string): Promise<void> => {
		return await OpfsErrorUtil.wrapOperation(
			async () => {
				// Create directories recursively if the path contains multiple segments
				const pathSegments = new Path(name).getSegments()
				let handle = this.directoryHandle

				for (const segment of pathSegments) {
					try {
						handle = await handle.getDirectoryHandle(segment)
					} catch {
						// Directory doesn't exist, create it
						handle = await handle.getDirectoryHandle(segment, {
							create: true,
						})
					}
				}
			},
			`Creating directory: ${this.dirPath.join(name).toString()}`,
		)
	}

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 * @param recursive If true, delete directory recursively.
	 */
	public readonly delete = async (recursive: boolean): Promise<void> => {
		if (this.dirPath.toString() === ".") {
			throw new FsErrorBadType("Cannot delete root directory")
		}

		return await OpfsErrorUtil.wrapOperation(async () => {
			const pathSegments = this.dirPath.getSegments()
			if (pathSegments.length === 0) {
				throw new FsErrorBadType("Cannot delete root directory")
			}

			const parentPath = this.dirPath.parent()
			if (!parentPath) {
				throw new FsErrorBadType("Cannot delete root directory")
			}

			const parentHandle = await this.getDirectoryHandleByPath(parentPath)
			const dirName = this.dirPath.basename()

			if (!dirName) {
				throw new FsErrorBadType("Invalid directory name")
			}

			// Check if directory is empty when recursive is false
			if (!recursive) {
				let hasEntries = false

				// Check if directory has any entries
				for await (const _ of this.directoryHandle.entries()) {
					hasEntries = true
					break
				}

				if (hasEntries) {
					throw new FsErrorBadType(
						`Directory not empty and recursive is false: ${this.dirPath.toString()}`,
					)
				}
			}

			await parentHandle.removeEntry(dirName, { recursive })
		}, `Deleting directory: ${this.dirPath.toString()}`)
	}

	/**
	 * Opens a file handle for a file in this directory.
	 * @param path Relative path to the file.
	 * @param settings Settings for opening the file.
	 */
	public readonly openFile = async (
		path: string,
		settings?: FileOpenSettings,
	): Promise<FileHandle> => {
		const filePath = this.dirPath.join(path)
		const pathSegments = new Path(path).getSegments()

		if (pathSegments.length === 0) {
			throw new FsErrorBadType("Invalid file path")
		}

		return await OpfsErrorUtil.wrapOperation(async () => {
			let handle = this.directoryHandle

			// Navigate to the directory containing the file
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const segment = pathSegments[i]
				if (!segment) continue

				try {
					handle = await handle.getDirectoryHandle(segment)
				} catch {
					if (settings?.create === true) {
						// Create intermediate directories if needed
						handle = await handle.getDirectoryHandle(segment, {
							create: true,
						})
					} else {
						// Throw a DOMException-like error that will be converted properly
						const notFoundError = new DOMException(
							`Directory not found: ${filePath.toString()}`,
							"NotFoundError",
						)
						throw notFoundError
					}
				}
			}

			const fileName = pathSegments[pathSegments.length - 1]
			if (!fileName) {
				throw new FsErrorBadType("Invalid file name")
			}

			// Check if file exists
			let fileHandle: FileSystemFileHandle
			try {
				fileHandle = await handle.getFileHandle(fileName)

				// File exists, check settings
				if (
					settings?.create === true &&
					settings?.allowExisting !== true
				) {
					throw new FsErrorAlreadyExists(
						`File already exists: ${filePath.toString()}`,
					)
				}
			} catch (error) {
				if (error instanceof Error && error.name === "NotFoundError") {
					// File doesn't exist
					if (settings?.create !== true) {
						const notFoundError = new DOMException(
							`File not found and create is not true: ${filePath.toString()}`,
							"NotFoundError",
						)
						throw notFoundError
					}

					// Create the file
					fileHandle = await handle.getFileHandle(fileName, {
						create: true,
					})
				} else {
					throw error
				}
			}

			return new OpfsFileHandle({
				fileHandle,
				filePath,
			})
		}, `Opening file: ${filePath.toString()}`)
	}

	/**
	 * Opens a directory handle for a subdirectory in this directory.
	 * @param path Relative path to the directory.
	 * @param settings Settings for opening the directory.
	 */
	public readonly openDir = async (
		path: string,
		settings?: DirOpenSettings,
	): Promise<DirHandle> => {
		// Validate that path is not empty
		if (path === "") {
			throw new FsErrorBadType("Directory name cannot be empty")
		}

		const subDirPath = this.dirPath.join(path)
		const pathSegments = new Path(path).getSegments()

		if (pathSegments.length === 0) {
			// This should never happen now that we check for empty path above,
			// but kept for defensive programming
			throw new FsErrorBadType("Directory name cannot be empty")
		}

		return await OpfsErrorUtil.wrapOperation(async () => {
			let handle = this.directoryHandle

			// Navigate to the directory, creating intermediate directories if needed
			for (let i = 0; i < pathSegments.length; i++) {
				const segment = pathSegments[i]
				if (!segment) continue

				try {
					handle = await handle.getDirectoryHandle(segment)

					// If this is the final segment and directory exists, check allowExisting
					if (
						i === pathSegments.length - 1 &&
						settings?.allowExisting === false
					) {
						throw new FsErrorAlreadyExists(
							`Directory already exists: ${subDirPath.toString()}`,
						)
					}
				} catch (error) {
					if (
						error instanceof Error &&
						error.name === "NotFoundError"
					) {
						// Directory doesn't exist
						if (settings?.create !== true) {
							const notFoundError = new DOMException(
								`Directory not found and create is not true: ${subDirPath.toString()}`,
								"NotFoundError",
							)
							throw notFoundError
						}

						// Create directory
						handle = await handle.getDirectoryHandle(segment, {
							create: true,
						})
					} else if (
						error instanceof Error &&
						error.name === "TypeMismatchError"
					) {
						throw new FsErrorBadType(
							`Expected directory but found file: ${subDirPath.toString()}`,
						)
					} else {
						throw error
					}
				}
			}

			return new OpfsDirHandle({
				directoryHandle: handle,
				dirPath: subDirPath,
				rootHandle: this.rootHandle,
			})
		}, `Opening directory: ${subDirPath.toString()}`)
	}

	/**
	 * Gets a directory handle by navigating to the specified path from the root.
	 */
	private readonly getDirectoryHandleByPath = async (
		path: Path,
		settings?: DirOpenSettings,
	): Promise<FileSystemDirectoryHandle> => {
		return await OpfsErrorUtil.wrapOperation(async () => {
			const pathSegments = path.getSegments()
			let handle = this.rootHandle

			for (const segment of pathSegments) {
				try {
					handle = await handle.getDirectoryHandle(segment)
				} catch (error) {
					if (
						error instanceof Error &&
						error.name === "NotFoundError"
					) {
						// Directory doesn't exist
						if (settings?.create === false) {
							const notFoundError = new DOMException(
								`Directory not found and create is false: ${path.toString()}`,
								"NotFoundError",
							)
							throw notFoundError
						}

						// Only create directory if explicitly requested
						if (settings?.create === true) {
							try {
								handle = await handle.getDirectoryHandle(
									segment,
									{ create: true },
								)
							} catch {
								const notFoundError = new DOMException(
									`Failed to create directory: ${path.toString()}`,
									"NotFoundError",
								)
								throw notFoundError
							}
						} else {
							// Default behavior when settings is undefined or create is undefined
							const notFoundError = new DOMException(
								`Directory not found: ${path.toString()}`,
								"NotFoundError",
							)
							throw notFoundError
						}
					} else if (
						error instanceof Error &&
						error.name === "TypeMismatchError"
					) {
						throw new FsErrorBadType(
							`Expected directory but found file: ${path.toString()}`,
						)
					} else {
						throw error
					}
				}
			}

			return handle
		}, `Getting directory handle: ${path.toString()}`)
	}
}
