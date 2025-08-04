import { FsDirHandle } from "../../defines/dirHandle"
import { Path } from "../../defines/path"
import { FsWriteMode } from "../../defines/writer"
import {
	FileListFile,
	ParsedFileListEntry,
	ParsedFileListRoot,
} from "./defines"

/**
 * Action to take when a file already exists during write operation.
 */
export enum FileExistsAction {
	/**
	 * Throw an error if the file already exists.
	 */
	THROW = "throw",
	/**
	 * Ignore the file if it already exists (skip writing).
	 */
	IGNORE = "ignore",
	/**
	 * Overwrite the file if it already exists.
	 */
	OVERWRITE = "overwrite",
}

/**
 * Configuration options for writeToDir operation.
 */
export interface WriteConfig {
	/**
	 * Action to take when a file already exists.
	 * @default FileExistsAction.OVERWRITE
	 */
	readonly onFileExists?: FileExistsAction
}

/**
 * Utility class for parsing and validating file lists.
 * This class provides static methods for working with file list structures.
 */
export class FileListUtils {
	private constructor() {}

	/**
	 * Parses a flat list of files into a tree structure based on their webkitRelativePath.
	 * Files without webkitRelativePath are treated as root-level files regardless of their name.
	 */
	public static readonly parse = <T extends FileListFile>(
		files: T[],
	): ParsedFileListRoot<T> => {
		const root: ParsedFileListRoot<T> = {
			files: [],
			children: [],
		}

		for (const file of files) {
			const path = file.webkitRelativePath

			if (!path) {
				root.files.push(file)
				continue
			}

			const pathParts = path.split("/").filter((part) => part.length > 0)

			if (pathParts.length === 1) {
				root.files.push(file)
			} else {
				let currentNode:
					| ParsedFileListRoot<T>
					| ParsedFileListEntry<T> = root

				for (let i = 0; i < pathParts.length - 1; i++) {
					const dirName = pathParts[i]!
					let childDir: ParsedFileListEntry<T> | undefined =
						currentNode.children.find(
							(child) => child.name === dirName,
						)

					if (!childDir) {
						childDir = {
							name: dirName,
							files: [],
							children: [],
						} as ParsedFileListEntry<T>
						currentNode.children.push(childDir)
					}

					currentNode = childDir
				}

				;(currentNode as ParsedFileListEntry<T>).files.push(
					file as unknown as File,
				)
			}
		}

		return root
	}

	/**
	 * Checks if a parsed file list represents a canonical file system tree.
	 * A canonical tree must satisfy:
	 * 1. Each entry either has children or files, but not both
	 * 2. Each entry may contain at most one file
	 * 3. Each file name may not contain "/" character
	 * 4. Each file and directory name may not be empty string
	 * 5. Directory names may not contain "/" character
	 * 6. No duplicate directory names at the same level
	 * 7. Files and directories cannot have the same name at the same level
	 */
	public static readonly isCanonical = <T extends FileListFile>(
		root: ParsedFileListRoot<T>,
	): boolean => {
		return FileListUtils.isCanonicalEntry(root, true)
	}

	private static readonly isCanonicalEntry = <T extends FileListFile>(
		entry: ParsedFileListRoot<T> | ParsedFileListEntry<T>,
		isRoot: boolean = false,
	): boolean => {
		if (entry.children.length > 0 && entry.files.length > 0) {
			return false
		}

		if (entry.files.length > 1) {
			return false
		}

		for (const file of entry.files) {
			if (file.name.includes("/")) {
				return false
			}
			if (file.name === "") {
				return false
			}
		}

		if (!isRoot) {
			const dirEntry = entry as ParsedFileListEntry<T>
			if (dirEntry.name === "" || dirEntry.name.includes("/")) {
				return false
			}
		}

		const dirNames = entry.children.map((child) => child.name)
		const uniqueDirNames = new Set(dirNames)
		if (dirNames.length !== uniqueDirNames.size) {
			return false
		}

		const fileNames = entry.files.map((file) => file.name)
		for (const fileName of fileNames) {
			if (dirNames.includes(fileName)) {
				return false
			}
		}

		for (const child of entry.children) {
			if (!FileListUtils.isCanonicalEntry(child, false)) {
				return false
			}
		}

		return true
	}

	/**
	 * Writes a parsed file list structure to an FsDirHandle.
	 * This method recursively creates directories and writes files based on the tree structure.
	 *
	 * @param root The parsed file list root or entry to write
	 * @param dirHandle The directory handle to write to
	 * @param config Configuration options for the write operation
	 */
	public static readonly writeToDir = async <T extends FileListFile>(
		root: ParsedFileListRoot<T> | ParsedFileListEntry<T>,
		dirHandle: FsDirHandle,
		config: WriteConfig = {},
	): Promise<void> => {
		const onFileExists = config.onFileExists ?? FileExistsAction.OVERWRITE

		for (const file of root.files) {
			const filePath = Path.parse(file.name)
			const existingFileHandle = await dirHandle.openFileOrNull(filePath)
			const fileExists = existingFileHandle !== null

			if (fileExists) {
				switch (onFileExists) {
					case FileExistsAction.THROW:
						throw new Error(`File already exists: ${file.name}`)
					case FileExistsAction.IGNORE:
						continue
					case FileExistsAction.OVERWRITE:
						break
					default:
						throw new Error(
							`Unknown FileExistsAction: ${onFileExists}`,
						)
				}
			}

			const fileHandle = await dirHandle.openFile(filePath, {
				create: true,
				allowExisting: true,
				createMissingDirs: false,
			})

			const writer = await fileHandle.write({
				mode: FsWriteMode.OVERWRITE,
			})

			if (file instanceof File) {
				await writer.write(file)
			} else {
				await writer.write(new ArrayBuffer(0))
			}

			await writer.close()
		}

		for (const child of root.children) {
			const childPath = Path.parse(child.name)
			const childDirHandle = await dirHandle.openDir(childPath, {
				create: true,
				allowExisting: true,
				createMissingDirs: false,
			})

			await FileListUtils.writeToDir(child, childDirHandle, config)
		}
	}
}
