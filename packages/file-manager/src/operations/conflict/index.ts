export enum FileAlreadyExistConflictResolutionType {
	SKIP = "skip",
	ERROR = "error",
	/**
	 * In case of file, overwrites it.
	 *
	 * For now it does not work for directories and will result in error.
	 *
	 * In the future, it should remove directory and replace it with file.
	 */
	OVERWRITE = "overwrite",
	RENAME = "rename",
}

export type FileAlreadyExistConflictResolution =
	| {
			type:
				| FileAlreadyExistConflictResolutionType.SKIP
				| FileAlreadyExistConflictResolutionType.ERROR
				| FileAlreadyExistConflictResolutionType.OVERWRITE
	  }
	| {
			type: FileAlreadyExistConflictResolutionType.RENAME
			newFileName: string
	  }
