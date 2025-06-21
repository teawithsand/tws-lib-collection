/**
 * Interface for writing file chunks during receiving
 */
export interface FileWriter {
	/**
	 * Write a chunk of file data
	 */
	writeChunk: (chunk: ArrayBuffer) => Promise<void>

	/**
	 * Close the writer when file transfer is complete
	 */
	close: () => Promise<void>
}

/**
 * Interface for receiving files
 */
export interface FileReceiverHandler<TGlobalHeader, TFileHeader> {
	/**
	 * Create a file writer for the incoming file
	 * @param globalHeader - The global transfer header
	 * @param fileHeader - The specific file header
	 * @param fileIndex - The index of the file being written (0-based)
	 * @returns A file writer to handle the incoming file data
	 */
	createFileWriter: (
		globalHeader: TGlobalHeader,
		fileHeader: TFileHeader,
		fileIndex: number,
	) => Promise<FileWriter>

	/**
	 * Close the receiver handler after all files have been received
	 */
	close: () => Promise<void>
}
