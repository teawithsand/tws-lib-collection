import { FsDirHandle } from "@teawithsand/fstate"

export interface UploadBlobInput {
	readonly blob: Blob
	readonly fileName: string
}

export interface UploadBlobsOperationArgs {
	readonly input: UploadBlobInput[]
	readonly output: FsDirHandle
	readonly chunkSize?: number
}

export enum UploadBlobsOperationStage {
	UPLOADING = "uploading",
}

export type UploadBlobsOperationState = {
	readonly stage: UploadBlobsOperationStage.UPLOADING
	readonly totalBlobs: number
	readonly processedBlobs: number
	readonly totalBytesWritten: number
	readonly totalBytesToWrite: number
	readonly currentFileName: string | null
	readonly currentBlobBytesWritten: number
}
