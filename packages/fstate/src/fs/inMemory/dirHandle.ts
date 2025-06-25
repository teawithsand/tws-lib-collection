import { FsHandle, FsHandleType } from "../defines/baseHandle"
import {
	DirStatResult,
	FsDirHandle,
	FsDirOpenOrNullSettings,
	FsDirOpenSettings,
	FsFileOpenOrNullSettings,
	FsFileOpenSettings,
} from "../defines/dirHandle"
import {
	FsErrorBadPath,
	FsErrorBadType,
	FsErrorNotFound,
} from "../defines/error"
import { FsFileHandle } from "../defines/fileHandle"
import { Path } from "../defines/path"
import { InMemoryFsDb, InMemoryFsDbHandle } from "./database"
import { InMemoryFileHandle } from "./fileHandle"

/**
 * In-memory implementation of FsDirHandle for testing and ephemeral storage.
 */
export class InMemoryDirHandle implements FsDirHandle {
	public readonly type = FsHandleType.DIR
	public readonly name: string
	public readonly path: Path

	private readonly db: InMemoryFsDb
	private readonly handle: InMemoryFsDbHandle

	/**
	 * @param db The in-memory database instance
	 * @param path The path to the directory
	 */
	public constructor(db: InMemoryFsDb, path: Path) {
		this.db = db
		this.handle = db.getHandle(path)
		this.name = this.handle.name
		this.path = this.handle.getPath()
	}

	/**
	 * Checks if the directory exists.
	 */
	public readonly exists = async (): Promise<boolean> => {
		const entry = this.handle.read()
		return !!entry && entry.type === FsHandleType.DIR
	}

	/**
	 * Lists entries in the directory.
	 */
	public readonly stat = async (): Promise<DirStatResult> => {
		// First check if the handle path is still valid (all parents exist)
		if (!this.isHandleValid()) {
			return { exists: false, entries: [] }
		}

		const entry = this.handle.read()
		if (!entry) {
			return { exists: false, entries: [] }
		}
		if (entry.type !== FsHandleType.DIR) {
			throw new Error(
				"Handle is invalid: target was recreated as a different type",
			)
		}
		const entries: FsHandle[] = entry.children.map((name) => {
			const childPath = this.handle.getPath().concat(name)
			const childHandle = this.db.getHandle(childPath)
			const childEntry = childHandle.read()
			if (childEntry?.type === FsHandleType.DIR) {
				return new InMemoryDirHandle(this.db, childPath)
			} else {
				return new InMemoryFileHandle(this.db, childPath)
			}
		})
		return { exists: true, entries }
	}

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 */
	public readonly delete = async (recursive: boolean): Promise<void> => {
		const entry = this.handle.read()
		if (!entry || entry.type !== FsHandleType.DIR) {
			// Deleting non-existent directory should not throw
			return
		}

		// Special case for root directory - only clear contents, don't delete the root itself
		if (this.path.toString() === "") {
			if (!recursive && entry.children.length > 0) {
				throw new Error("Directory is not empty.")
			}
			// Delete all children if recursive or if root is empty
			if (recursive || entry.children.length === 0) {
				for (const name of [...entry.children]) {
					const childPath = this.handle.getPath().concat(name)
					const childHandle = this.db.getHandle(childPath)
					const childEntry = childHandle.read()
					if (childEntry?.type === FsHandleType.DIR) {
						await new InMemoryDirHandle(this.db, childPath).delete(
							true,
						)
					} else {
						childHandle.delete()
					}
				}
				// Clear the children array but keep the root directory
				this.handle.writeForce({ type: FsHandleType.DIR, children: [] })
			}
			return
		}

		if (!recursive && entry.children.length > 0) {
			throw new Error("Directory is not empty.")
		}
		// Delete all children if recursive
		if (recursive) {
			for (const name of entry.children) {
				const childPath = this.handle.getPath().concat(name)
				const childHandle = this.db.getHandle(childPath)
				const childEntry = childHandle.read()
				if (childEntry?.type === FsHandleType.DIR) {
					await new InMemoryDirHandle(this.db, childPath).delete(true)
				} else {
					childHandle.delete()
				}
			}
		}

		// Update parent directory's children list to remove this directory
		const parentPath = this.path.parent()
		if (parentPath) {
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = parentHandle.read()
			if (parentEntry && parentEntry.type === FsHandleType.DIR) {
				const updatedChildren = parentEntry.children.filter(
					(childName) => childName !== this.name,
				)
				parentHandle.writeForce({
					type: FsHandleType.DIR,
					children: updatedChildren,
				})
			}
		}

		this.handle.delete()
	}

	/**
	 * Opens a file handle for a file in this directory.
	 */
	public readonly openFile = async (
		path: Path,
		settings?: FsFileOpenSettings,
	): Promise<FsFileHandle> => {
		// Check for empty path - cannot open file with empty path
		if (path.getSegments().length === 0) {
			throw new FsErrorBadPath("Cannot open file with empty path")
		}

		const targetPath = this.handle.getPath().concat(path)
		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = targetHandle.read()

		// Check if there's a conflicting directory
		if (existingEntry && existingEntry.type === FsHandleType.DIR) {
			throw new Error("Cannot open file: path exists as directory")
		}

		// Validate that all parent directories in the path are actually directories
		if (!settings?.create || !settings?.createMissingDirs) {
			// If not creating or not creating missing dirs, validate that parent directories exist
			await this.validateParentDirectories(targetPath)
		} else {
			// If creating with createMissingDirs, only validate that existing parent path segments are directories (not files)
			const pathSegments = targetPath.getSegments()
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const parentPath = Path.from(
					pathSegments.slice(0, i + 1).join("/"),
				)
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()

				// If parent exists and is a file, throw error
				if (parentEntry && parentEntry.type === FsHandleType.FILE) {
					throw new Error(
						"Cannot open file: parent path contains a file instead of directory",
					)
				}
			}
		}

		// Check if file doesn't exist and create is not set
		if (!existingEntry && !settings?.create) {
			throw new FsErrorNotFound("File does not exist")
		}

		// Create file if it doesn't exist and create is true
		if ((!existingEntry || settings?.create) && settings?.create) {
			// Create missing parent directories only if createMissingDirs is true
			if (settings?.createMissingDirs) {
				await this.createMissingDirectories(targetPath)
			}

			// Ensure parent directory exists and add this file to its children
			const parentPath = targetPath.parent()
			if (parentPath) {
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()
				if (parentEntry && parentEntry.type === FsHandleType.DIR) {
					const fileName = targetPath.basename()
					if (fileName && !parentEntry.children.includes(fileName)) {
						parentEntry.children.push(fileName)
						parentHandle.writeForce(parentEntry)
					}
				}
			}
			// Create empty file (will overwrite directory if it exists)
			targetHandle.writeForce({
				type: FsHandleType.FILE,
				content: new Blob([]),
			})
		}

		return new InMemoryFileHandle(this.db, targetPath, settings?.openMode)
	}

	/**
	 * Opens a file handle for a file in this directory. Returns null if the file does not exist.
	 */
	public readonly openFileOrNull = async (
		path: Path,
		settings?: FsFileOpenOrNullSettings,
	): Promise<FsFileHandle | null> => {
		const targetPath = this.handle.getPath().concat(path)
		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = targetHandle.read()

		// Check if there's a conflicting directory
		if (existingEntry && existingEntry.type === FsHandleType.DIR) {
			throw new Error("Cannot open file: path exists as directory")
		}

		// Validate parent directories based on settings
		if (settings?.allowMissingParentDirectories !== true) {
			// If allowMissingParentDirectories is false or undefined, validate that parents exist
			try {
				await this.validateParentDirectories(targetPath)
			} catch (error) {
				// If validation fails and allowMissingParentDirectories is false, throw
				throw error
			}
		} else {
			// If allowMissingParentDirectories is true, check if parents are missing
			const pathSegments = targetPath.getSegments()
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const parentPath = Path.from(
					pathSegments.slice(0, i + 1).join("/"),
				)
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()

				// If parent doesn't exist, return null
				if (!parentEntry) {
					return null
				}

				// If parent exists and is a file, throw error
				if (parentEntry.type === FsHandleType.FILE) {
					throw new Error(
						"Cannot open file: parent path contains a file instead of directory",
					)
				}
			}
		}

		const fileHandle = new InMemoryFileHandle(this.db, targetPath)
		if (!(await fileHandle.exists())) {
			return null
		}
		return fileHandle
	}

	/**
	 * Opens a directory handle for a subdirectory in this directory.
	 */
	public readonly openDir = async (
		path: Path,
		settings?: FsDirOpenSettings,
	): Promise<FsDirHandle> => {
		const targetPath = this.handle.getPath().concat(path)
		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = targetHandle.read()

		// Check if there's a conflicting file
		if (existingEntry && existingEntry.type === FsHandleType.FILE) {
			throw new FsErrorBadType(
				"Cannot open directory: path exists as file",
			)
		}

		// Validate that all parent directories in the path are actually directories
		if (!settings?.create || !settings?.createMissingDirs) {
			// If not creating or not creating missing dirs, validate that parent directories exist
			await this.validateParentDirectories(targetPath)
		} else {
			// If creating with createMissingDirs, only validate that existing parent path segments are directories (not files)
			const pathSegments = targetPath.getSegments()
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const parentPath = Path.from(
					pathSegments.slice(0, i + 1).join("/"),
				)
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()

				// If parent exists and is a file, throw error
				if (parentEntry && parentEntry.type === FsHandleType.FILE) {
					throw new Error(
						"Cannot open directory: parent path contains a file instead of directory",
					)
				}
			}
		}

		// Check if directory doesn't exist and create is not set
		if (!existingEntry && !settings?.create) {
			throw new FsErrorNotFound("Directory does not exist")
		}

		// Create directory if it doesn't exist and create is true
		if ((!existingEntry || settings?.create) && settings?.create) {
			// Create missing parent directories only if createMissingDirs is true
			if (settings?.createMissingDirs) {
				await this.createMissingDirectories(targetPath)
			}

			// Ensure parent directory exists and add this directory to its children
			const parentPath = targetPath.parent()
			if (parentPath) {
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()
				if (parentEntry && parentEntry.type === FsHandleType.DIR) {
					const dirName = targetPath.basename()
					if (dirName && !parentEntry.children.includes(dirName)) {
						parentEntry.children.push(dirName)
						parentHandle.writeForce(parentEntry)
					}
				}
			}
			// Create empty directory (will overwrite file if it exists)
			targetHandle.writeForce({
				type: FsHandleType.DIR,
				children: [],
			})
		}

		return new InMemoryDirHandle(this.db, targetPath)
	}

	/**
	 * Opens a directory handle for a subdirectory in this directory. Returns null if the directory does not exist.
	 */
	public readonly openDirOrNull = async (
		path: Path,
		settings?: FsDirOpenOrNullSettings,
	): Promise<FsDirHandle | null> => {
		const targetPath = this.handle.getPath().concat(path)
		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = targetHandle.read()

		// Check if there's a conflicting file
		if (existingEntry && existingEntry.type === FsHandleType.FILE) {
			throw new FsErrorBadType(
				"Cannot open directory: path exists as file",
			)
		}

		// Validate parent directories based on settings
		if (settings?.allowMissingParentDirectories !== true) {
			// If allowMissingParentDirectories is false or undefined, validate that parents exist
			try {
				await this.validateParentDirectories(targetPath)
			} catch (error) {
				// If validation fails and allowMissingParentDirectories is false, throw
				throw error
			}
		} else {
			// If allowMissingParentDirectories is true, check if parents are missing
			const pathSegments = targetPath.getSegments()
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const parentPath = Path.from(
					pathSegments.slice(0, i + 1).join("/"),
				)
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = parentHandle.read()

				// If parent doesn't exist, return null
				if (!parentEntry) {
					return null
				}

				// If parent exists and is a file, throw error
				if (parentEntry.type === FsHandleType.FILE) {
					throw new Error(
						"Cannot open directory: parent path contains a file instead of directory",
					)
				}
			}
		}

		const dirHandle = new InMemoryDirHandle(this.db, targetPath)
		if (!(await dirHandle.exists())) {
			return null
		}
		return dirHandle
	}

	/**
	 * Creates missing parent directories for the given path.
	 */
	private readonly createMissingDirectories = async (
		targetPath: Path,
	): Promise<void> => {
		const pathSegments = targetPath.getSegments()
		// Start from root and create each directory in the path
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const dirPath = Path.from(pathSegments.slice(0, i + 1).join("/"))
			const dirHandle = this.db.getHandle(dirPath)
			const dirEntry = dirHandle.read()

			if (!dirEntry) {
				// Create the directory
				dirHandle.writeForce({
					type: FsHandleType.DIR,
					children: [],
				})

				// Add to parent's children list
				if (i > 0) {
					const parentPath = Path.from(
						pathSegments.slice(0, i).join("/"),
					)
					const parentHandle = this.db.getHandle(parentPath)
					const parentEntry = parentHandle.read()
					if (parentEntry && parentEntry.type === FsHandleType.DIR) {
						const dirName = pathSegments[i]
						if (
							dirName &&
							!parentEntry.children.includes(dirName)
						) {
							parentEntry.children.push(dirName)
							parentHandle.writeForce(parentEntry)
						}
					}
				} else {
					// Adding to root
					const rootHandle = this.db.getHandle(Path.from(""))
					const rootEntry = rootHandle.read()
					if (rootEntry && rootEntry.type === FsHandleType.DIR) {
						const dirName = pathSegments[0]
						if (dirName && !rootEntry.children.includes(dirName)) {
							rootEntry.children.push(dirName)
							rootHandle.writeForce(rootEntry)
						}
					}
				}
			} else if (dirEntry.type === FsHandleType.FILE) {
				// If existing entry is a file, we can't create a directory here
				throw new Error("Cannot create directory: path contains a file")
			}
		}
	}

	/**
	 * Checks if this handle is still valid by verifying all parent directories exist.
	 */
	private readonly isHandleValid = (): boolean => {
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
	/**
	 * Validates that all parent directories in the path are actually directories (not files).
	 */
	private readonly validateParentDirectories = async (
		targetPath: Path,
	): Promise<void> => {
		const pathSegments = targetPath.getSegments()
		// Check each parent directory in the path
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const parentPath = Path.from(pathSegments.slice(0, i + 1).join("/"))
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = parentHandle.read()

			// If parent doesn't exist, throw error
			if (!parentEntry) {
				throw new Error("Cannot open: parent directory does not exist")
			}

			// If parent exists and is a file (not a directory), throw error
			if (parentEntry.type === FsHandleType.FILE) {
				throw new Error(
					"Cannot open: parent path contains a file instead of directory",
				)
			}
		}
	}
}
