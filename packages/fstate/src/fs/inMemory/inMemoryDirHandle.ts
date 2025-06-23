import { DirHandle } from "../defines/dirHandle"
import { DirOpenSettings } from "../defines/dirOpenSettings"
import {
	FsErrorAlreadyExists,
	FsErrorBadType,
	FsErrorNotFound,
} from "../defines/error"
import { FileHandle } from "../defines/fileHandle"
import { FileOpenSettings } from "../defines/fileOpenSettings"
import { FsEntry } from "../defines/fsEntry"
import { Path } from "../defines/path"
import { InMemoryDirNode, InMemoryFileNode, InMemoryNodeUtil } from "./db"
import { InMemoryFileHandle } from "./inMemoryFileHandle"

/**
 * In-memory implementation of DirHandle.
 */
export class InMemoryDirHandle implements DirHandle {
	private readonly rootNode: InMemoryDirNode
	private readonly dirPath: Path

	public constructor({
		rootNode,
		dirPath,
	}: {
		rootNode: InMemoryDirNode
		dirPath: Path
	}) {
		this.rootNode = rootNode
		this.dirPath = dirPath
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
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.dirPath,
		)
		return (
			node !== undefined &&
			InMemoryNodeUtil.isDirNode(node) &&
			!node.deleted
		)
	}

	/**
	 * Lists entries in the directory.
	 */
	public readonly list = async (): Promise<FsEntry[]> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.dirPath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`Directory not found: ${this.dirPath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isDirNode(node)) {
			throw new FsErrorBadType(
				`Expected directory but found file: ${this.dirPath.toString()}`,
			)
		}

		const entries: FsEntry[] = []
		for (const [name, child] of node.entries) {
			if (!child.deleted) {
				entries.push({
					path: new Path(name),
					isDirectory: InMemoryNodeUtil.isDirNode(child),
				})
			}
		}

		return entries
	}

	/**
	 * Creates a subdirectory (recursive).
	 * @param name Name of the subdirectory.
	 */
	public readonly mkdir = async (name: string): Promise<void> => {
		const subDirPath = this.dirPath.join(name)
		const existingNode = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			subDirPath,
		)

		if (existingNode && !existingNode.deleted) {
			if (InMemoryNodeUtil.isDirNode(existingNode)) {
				// Directory already exists, this is okay for mkdir
				return
			} else {
				throw new FsErrorBadType(
					`Cannot create directory, file exists at: ${subDirPath.toString()}`,
				)
			}
		}

		const newDir: InMemoryDirNode = {
			type: "directory",
			name: "",
			parent: this.rootNode,
			entries: new Map(),
			deleted: false,
		}

		InMemoryNodeUtil.createEntryByPath(this.rootNode, subDirPath, {
			entry: newDir,
			override: false,
			createDirs: true,
		})
	}

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 * @param recursive If true, delete directory recursively.
	 */
	public readonly delete = async (recursive: boolean): Promise<void> => {
		const node = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			this.dirPath,
		)
		if (!node || node.deleted) {
			throw new FsErrorNotFound(
				`Directory not found: ${this.dirPath.toString()}`,
			)
		}
		if (!InMemoryNodeUtil.isDirNode(node)) {
			throw new FsErrorBadType(
				`Expected directory but found file: ${this.dirPath.toString()}`,
			)
		}

		if (!recursive && node.entries.size > 0) {
			// Check if directory has non-deleted entries
			const hasActiveEntries = Array.from(node.entries.values()).some(
				(child) => !child.deleted,
			)
			if (hasActiveEntries) {
				throw new FsErrorBadType(
					`Directory not empty and recursive is false: ${this.dirPath.toString()}`,
				)
			}
		}

		InMemoryNodeUtil.removeEntryByPath(node)
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
		const existingNode = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			filePath,
		)

		if (existingNode && !existingNode.deleted) {
			if (InMemoryNodeUtil.isFileNode(existingNode)) {
				// File exists, check allowExisting if we're creating
				if (
					settings?.create === true &&
					settings?.allowExisting !== true
				) {
					throw new FsErrorAlreadyExists(
						`File already exists: ${filePath.toString()}`,
					)
				}
				// File exists and can be opened, return handle to existing file
				return new InMemoryFileHandle({
					rootNode: this.rootNode,
					filePath,
				})
			} else {
				throw new FsErrorBadType(
					`Expected file but found directory: ${filePath.toString()}`,
				)
			}
		} else if (!existingNode || existingNode.deleted) {
			// File doesn't exist, check create
			if (settings?.create !== true) {
				throw new FsErrorNotFound(
					`File not found and create is not true: ${filePath.toString()}`,
				)
			}

			// Create the file
			const newFileNode: InMemoryFileNode = {
				type: "file",
				name: "",
				parent: this.rootNode, // This will be overridden in createEntryByPath
				content: new Blob([]),
				deleted: false,
			}

			InMemoryNodeUtil.createEntryByPath(this.rootNode, filePath, {
				entry: newFileNode,
				override: false,
				createDirs: true,
			})
		}

		return new InMemoryFileHandle({
			rootNode: this.rootNode,
			filePath,
		})
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
		const existingNode = InMemoryNodeUtil.getEntryByPath(
			this.rootNode,
			subDirPath,
		)

		if (existingNode && !existingNode.deleted) {
			if (InMemoryNodeUtil.isDirNode(existingNode)) {
				// Directory exists, check allowExisting
				if (settings?.allowExisting === false) {
					throw new FsErrorAlreadyExists(
						`Directory already exists: ${subDirPath.toString()}`,
					)
				}
			} else {
				throw new FsErrorBadType(
					`Expected directory but found file: ${subDirPath.toString()}`,
				)
			}
		} else if (!existingNode || existingNode.deleted) {
			// Directory doesn't exist, check create
			if (settings?.create === false) {
				throw new FsErrorNotFound(
					`Directory not found and create is false: ${subDirPath.toString()}`,
				)
			}

			// Create the directory if create is true (default)
			if (settings?.create ?? true) {
				const newDir: InMemoryDirNode = {
					type: "directory",
					name: "",
					parent: this.rootNode,
					entries: new Map(),
					deleted: false,
				}

				InMemoryNodeUtil.createEntryByPath(this.rootNode, subDirPath, {
					entry: newDir,
					override: false,
					createDirs: settings?.isRecursive !== false, // Default to recursive
				})
			}
		}

		return new InMemoryDirHandle({
			rootNode: this.rootNode,
			dirPath: subDirPath,
		})
	}
}
