/**
 * Interface for reading file chunks during sending
 */
export interface FileReader {
	/**
	 * Read the next chunk of file data
	 * @returns The next chunk or null if the file has ended
	 */
	readChunk: () => Promise<ArrayBuffer | null>

	/**
	 * Close the reader
	 */
	close: () => Promise<void>
}

/**
 * Interface for providing files to send
 */
export interface FileSource<TFileHeader> {
	/**
	 * Get the next file to send
	 * @returns File reader and header, or null if no more files
	 */
	next: () => Promise<{ reader: FileReader; header: TFileHeader } | null>

	/**
	 * Close the file source when all files have been sent
	 */
	close: () => Promise<void>
}
