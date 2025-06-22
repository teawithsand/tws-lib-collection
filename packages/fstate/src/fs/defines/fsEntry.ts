/**
 * Represents a file system entry (file or directory).
 */
export interface FsEntry {
	readonly path: string
	readonly isDirectory: boolean
	readonly lastModified?: number
}
