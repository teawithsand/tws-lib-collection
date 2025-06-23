export enum FsWriteMode {
	APPEND = "append",
	OVERWRITE = "overwrite",
}

export interface FsWriteSettings {
	/**
	 * @default FsWriteMode.OVERWRITE
	 */
	mode?: FsWriteMode
}

export interface FsWriter {
	write: (data: ArrayBuffer | Blob) => Promise<void>
	close: () => Promise<void>
}
