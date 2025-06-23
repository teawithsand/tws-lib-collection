import { FsBaseHandle, FsHandle, FsHandleType } from "./baseHandle"
import { FsFileHandle, FsFileOpenMode } from "./fileHandle"
import { Path } from "./path"
/**
 * Settings for opening a file.
 */
export type FsFileOpenSettings = {
	/**
	 * @default false
	 */
	create?: boolean

	/**
	 * @default true
	 */
	allowExisting?: boolean

	/**
	 * When true and combined with `create`, creates the directory recursively until file is reached or created.
	 *
	 * @default false
	 */
	createMissingDirs?: boolean

	/**
	 * Mode to open the file in.
	 *
	 * @default FsFileOpenMode.READ_WRITE
	 */
	openMode?: FsFileOpenMode
}

export type FsFileOpenOrNullSettings = {
	/**
	 * When true, opening will return null if some directory on the path does not exist.
	 *
	 * Otherwise it will throw.
	 *
	 * @default false
	 */
	readonly allowMissingParentDirectories?: boolean
}

/**
 * Settings for opening a directory.
 */
export type FsDirOpenSettings = {
	/**
	 * Create file if it does not exist.
	 *
	 * @default false
	 */
	readonly create?: boolean

	/**
	 * @default true
	 */
	readonly allowExisting?: boolean

	/**
	 * When true and combined with `create`, creates the directory recursively.
	 *
	 * @default false
	 */
	readonly createMissingDirs?: boolean
}

export type FsDirOpenOrNullSettings = {
	/**
	 * When true, opening will return null if some directory on the path does not exist.
	 *
	 * Otherwise it will throw.
	 *
	 * @default false
	 */
	readonly allowMissingParentDirectories?: boolean
}

/**
 * Result of stat operation for a file.
 */
export type DirStatResult =
	| {
			exists: true
			entries: FsHandle[]
	  }
	| {
			exists: false
			entries: []
	  }

/**
 * Handle for an open directory.
 */
export interface FsDirHandle extends FsBaseHandle {
	readonly type: FsHandleType.DIR

	/**
	 * Checks if the directory exists.
	 */
	readonly exists: () => Promise<boolean>

	/**
	 * Lists entries in the directory.
	 */
	readonly stat: () => Promise<DirStatResult>

	/**
	 * Deletes the directory.
	 * For directories, if recursive is false and the directory is not empty, the operation fails.
	 * @param recursive If true, delete directory recursively.
	 */
	readonly delete: (recursive: boolean) => Promise<void>

	/**
	 * Opens a file handle for a file in this directory.
	 * @param path Relative path to the file.
	 * @param settings Settings for opening the file.
	 */
	readonly openFile: (
		path: Path,
		settings?: FsFileOpenSettings,
	) => Promise<FsFileHandle>

	/**
	 * Opens a file handle for a file in this directory.
	 *
	 * Returns null if the file does not exist.
	 *
	 * Still throws if directory on the path does not exist, not the final dir.
	 *
	 * @param path Relative path to the file.
	 * @param settings Settings for opening the file.
	 */
	readonly openFileOrNull: (
		path: Path,
		settings?: FsFileOpenOrNullSettings,
	) => Promise<FsFileHandle | null>

	/**
	 * Opens a directory handle for a subdirectory in this directory.
	 * @param path Relative path to the directory.
	 * @param settings Settings for opening the directory.
	 */
	readonly openDir: (
		path: Path,
		settings?: FsDirOpenSettings,
	) => Promise<FsDirHandle>

	/**
	 * Opens a directory handle for a subdirectory in this directory.
	 *
	 * Returns null if the directory does not exist.
	 *
	 * Still throws if directory on the path does not exist, not the final dir.
	 *
	 * @param path Relative path to the directory.
	 * @param settings Settings for opening the directory.
	 */
	readonly openDirOrNull: (
		path: Path,
		settings?: FsDirOpenOrNullSettings,
	) => Promise<FsDirHandle | null>
}
