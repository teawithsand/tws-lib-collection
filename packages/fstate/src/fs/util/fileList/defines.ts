export type FileListFile = {
	name: string
	webkitRelativePath?: string
}

export type ParsedFileListRoot<T extends FileListFile = File> = {
	name?: undefined
	files: T[]
	children: ParsedFileListEntry<T>[]
}

/**
 * Represents a node in a parsed file list tree structure.
 * Each entry can contain files and/or child entries representing subdirectories.
 */
export type ParsedFileListEntry<T extends FileListFile = File> = {
	name: string
	files: File[]
	children: ParsedFileListEntry<T>[]
}
