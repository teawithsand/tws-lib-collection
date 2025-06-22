/**
 * Result of stat operation for a file.
 */
export interface FileStatResult {
	readonly exists: boolean
	readonly size?: number
}
