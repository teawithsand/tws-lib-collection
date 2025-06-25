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
import { IndexedDbFsDb, IndexedDbFsDbHandle } from "./database"
import { IndexedDbFileHandle } from "./fileHandle"

/**
 * IndexedDB implementation of FsDirHandle for persistent browser storage.
 */
export class IndexedDbDirHandle implements FsDirHandle {
	public readonly type = FsHandleType.DIR
	public readonly name: string
	public readonly path: Path

	private readonly db: IndexedDbFsDb
	private readonly handle: IndexedDbFsDbHandle

	/**
	 * @param db The IndexedDB database instance
	 * @param path The path to the directory
	 */
	public constructor(db: IndexedDbFsDb, path: Path) {
		this.db = db
		this.handle = db.getHandle(path)
		this.name = this.handle.name
		this.path = this.handle.getPath()
	}

	/**
	 * Checks if the directory exists.
	 */
	public readonly exists = async (): Promise<boolean> => {
		const entry = await this.handle.read()
		return !!entry && entry.type === FsHandleType.DIR
	}

	/**
	 * Lists entries in the directory.
	 */
	public readonly stat = async (): Promise<DirStatResult> => {
		const entry = await this.handle.read()
		if (!entry) {
			return { exists: false, entries: [] }
		}
		if (entry.type !== FsHandleType.DIR) {
			throw new Error(
				"Handle is invalid: target was recreated as a different type",
			)
		}

		// Check if the handle path is still valid (all parents exist as directories)
		if (!(await this.isHandleValid())) {
			return { exists: false, entries: [] }
		}

		const entries: FsHandle[] = []
		for (const name of entry.children) {
			const childPath = this.handle.getPath().concat(name)
			const childHandle = this.db.getHandle(childPath)
			const childEntry = await childHandle.read()
			if (childEntry?.type === FsHandleType.DIR) {
				entries.push(new IndexedDbDirHandle(this.db, childPath))
			} else {
				entries.push(new IndexedDbFileHandle(this.db, childPath))
			}
		}
		return { exists: true, entries }
	}

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 */
	public readonly delete = async (recursive: boolean): Promise<void> => {
		const entry = await this.handle.read()
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
					const childEntry = await childHandle.read()
					if (childEntry?.type === FsHandleType.DIR) {
						await new IndexedDbDirHandle(this.db, childPath).delete(
							true,
						)
					} else {
						await childHandle.delete()
					}
				}
				// Clear the children array but keep the root directory
				await this.handle.writeForce({
					type: FsHandleType.DIR,
					children: [],
				})
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
				const childEntry = await childHandle.read()
				if (childEntry?.type === FsHandleType.DIR) {
					await new IndexedDbDirHandle(this.db, childPath).delete(
						true,
					)
				} else {
					await childHandle.delete()
				}
			}
		}

		// Update parent directory's children list to remove this directory
		const parentPath = this.path.parent()
		if (parentPath) {
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = await parentHandle.read()
			if (parentEntry && parentEntry.type === FsHandleType.DIR) {
				const updatedChildren = parentEntry.children.filter(
					(childName) => childName !== this.name,
				)
				await parentHandle.writeForce({
					type: FsHandleType.DIR,
					children: updatedChildren,
				})
			}
		}

		await this.handle.delete()
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
		const existingEntry = await targetHandle.read()

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
				const parentEntry = await parentHandle.read()

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
				const parentEntry = await parentHandle.read()
				if (parentEntry && parentEntry.type === FsHandleType.DIR) {
					const fileName = targetPath.basename()
					if (fileName && !parentEntry.children.includes(fileName)) {
						parentEntry.children.push(fileName)
						await parentHandle.writeForce(parentEntry)
					}
				}
			}

			// Create the file if it doesn't exist
			if (!existingEntry) {
				await targetHandle.writeForce({
					type: FsHandleType.FILE,
					content: new Blob([]),
				})
			}
		}

		return new IndexedDbFileHandle(this.db, targetPath)
	}

	/**
	 * Opens a file handle or returns null if it doesn't exist.
	 */
	public readonly openFileOrNull = async (
		path: Path,
		settings?: FsFileOpenOrNullSettings,
	): Promise<FsFileHandle | null> => {
		if (path.getSegments().length === 0) {
			throw new FsErrorBadPath("Cannot open file with empty path")
		}

		const targetPath = this.handle.getPath().concat(path)

		try {
			await this.validateParentDirectories(targetPath)
		} catch (error) {
			if (
				error instanceof FsErrorNotFound &&
				settings?.allowMissingParentDirectories
			) {
				return null
			}
			throw error
		}

		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = await targetHandle.read()

		if (!existingEntry) {
			return null
		}

		if (existingEntry.type !== FsHandleType.FILE) {
			throw new FsErrorBadType(
				"Cannot open file: path exists as directory",
			)
		}

		return new IndexedDbFileHandle(this.db, targetPath)
	}

	/**
	 * Opens a directory handle for a subdirectory.
	 */
	public readonly openDir = async (
		path: Path,
		settings?: FsDirOpenSettings,
	): Promise<FsDirHandle> => {
		const targetPath = this.handle.getPath().concat(path)
		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = await targetHandle.read()

		// Check if there's a conflicting file
		if (existingEntry && existingEntry.type === FsHandleType.FILE) {
			throw new FsErrorBadType(
				"Cannot open directory: path exists as file",
			)
		}

		// Validate that all parent directories in the path are actually directories
		if (!settings?.create || !settings?.createMissingDirs) {
			await this.validateParentDirectories(targetPath)
		} else {
			// If creating with createMissingDirs, only validate that existing parent path segments are directories (not files)
			const pathSegments = targetPath.getSegments()
			for (let i = 0; i < pathSegments.length - 1; i++) {
				const parentPath = Path.from(
					pathSegments.slice(0, i + 1).join("/"),
				)
				const parentHandle = this.db.getHandle(parentPath)
				const parentEntry = await parentHandle.read()

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
				const parentEntry = await parentHandle.read()
				if (parentEntry && parentEntry.type === FsHandleType.DIR) {
					const dirName = targetPath.basename()
					if (dirName && !parentEntry.children.includes(dirName)) {
						parentEntry.children.push(dirName)
						await parentHandle.writeForce(parentEntry)
					}
				}
			}

			// Create the directory if it doesn't exist
			if (!existingEntry) {
				await targetHandle.writeForce({
					type: FsHandleType.DIR,
					children: [],
				})
			}
		}

		return new IndexedDbDirHandle(this.db, targetPath)
	}

	/**
	 * Opens a directory handle or returns null if it doesn't exist.
	 */
	public readonly openDirOrNull = async (
		path: Path,
		settings?: FsDirOpenOrNullSettings,
	): Promise<FsDirHandle | null> => {
		if (path.getSegments().length === 0) {
			return this
		}
		const targetPath = this.handle.getPath().concat(path)

		try {
			await this.validateParentDirectories(targetPath)
		} catch (error) {
			if (
				error instanceof FsErrorNotFound &&
				settings?.allowMissingParentDirectories
			) {
				return null
			}
			throw error
		}

		const targetHandle = this.db.getHandle(targetPath)
		const existingEntry = await targetHandle.read()

		if (!existingEntry) {
			return null
		}

		if (existingEntry.type !== FsHandleType.DIR) {
			throw new FsErrorBadType(
				"Cannot open directory: path exists as file",
			)
		}

		return new IndexedDbDirHandle(this.db, targetPath)
	}

	/**
	 * Validates that all parent directories exist and are directories.
	 */
	private readonly validateParentDirectories = async (
		targetPath: Path,
	): Promise<void> => {
		const pathSegments = targetPath.getSegments()
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const parentPath = Path.from(pathSegments.slice(0, i + 1).join("/"))
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = await parentHandle.read()

			if (!parentEntry) {
				throw new FsErrorNotFound(
					`Parent directory does not exist: ${parentPath.toString()}`,
				)
			}
			if (parentEntry.type !== FsHandleType.DIR) {
				throw new FsErrorBadType(
					`Parent path is not a directory: ${parentPath.toString()}`,
				)
			}
		}
	}

	/**
	 * Creates missing parent directories for the given path.
	 */
	private readonly createMissingDirectories = async (
		targetPath: Path,
	): Promise<void> => {
		const pathSegments = targetPath.getSegments()
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const parentPath = Path.from(pathSegments.slice(0, i + 1).join("/"))
			const parentHandle = this.db.getHandle(parentPath)
			const parentEntry = await parentHandle.read()

			if (!parentEntry) {
				// Create the missing directory
				await parentHandle.writeForce({
					type: FsHandleType.DIR,
					children: [],
				})

				// Add to its parent's children
				const grandParentPath = parentPath.parent()
				if (grandParentPath) {
					const grandParentHandle = this.db.getHandle(grandParentPath)
					const grandParentEntry = await grandParentHandle.read()
					if (
						grandParentEntry &&
						grandParentEntry.type === FsHandleType.DIR
					) {
						const dirName = parentPath.basename()
						if (
							dirName &&
							!grandParentEntry.children.includes(dirName)
						) {
							grandParentEntry.children.push(dirName)
							await grandParentHandle.writeForce(grandParentEntry)
						}
					}
				}
			}
		}
	}

	/**
	 * Checks if the handle path is still valid (all parent directories exist).
	 */
	private readonly isHandleValid = async (): Promise<boolean> => {
		const pathSegments = this.path.getSegments()
		// Check only parent directories, not the current directory itself
		for (let i = 0; i < pathSegments.length - 1; i++) {
			const ancestorPath = Path.from(
				pathSegments.slice(0, i + 1).join("/"),
			)
			const ancestorHandle = this.db.getHandle(ancestorPath)
			const ancestorEntry = await ancestorHandle.read()
			if (!ancestorEntry || ancestorEntry.type !== FsHandleType.DIR) {
				return false
			}
		}
		return true
	}
}
