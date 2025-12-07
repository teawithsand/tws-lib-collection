import { FsDirHandle, FsFileHandle, FsHandle, Path } from "@teawithsand/fstate"
import { FileAlreadyExistConflictResolution } from "../conflict"

export interface CopyOperationConflictResolver {
	resolveFileAlreadyExistConflict: (
		input: FsFileHandle,
		preExistingOutputHandle: FsHandle,
	) => Promise<FileAlreadyExistConflictResolution>
}

export interface CopyToDirOperationArgs {
	input: FsHandle[]
	output: FsDirHandle
	conflictResolver?: CopyOperationConflictResolver
}
export enum CopyToDirOperationStage {
	DISCOVERY = "discovery",
	COPYING = "copying",
}

export type CopyToDirOperationState =
	| {
			stage: CopyToDirOperationStage.DISCOVERY
			discoveredFiles: number
			discoveredDirs: number
	  }
	| {
			stage: CopyToDirOperationStage.COPYING
			discoveredFiles: number
			discoveredDirs: number

			totalFilesProcessed: number
			totalDirsProcessed: number
			totalBytesCopied: number

			totalFilesSkipped: number
			totalDirsSkipped: number

			currentFileBytesCopied: number
			currentInputFile: FsFileHandle | null
	  }

export interface CopyEntryOperationArgs {
	input: FsHandle
	pathResolutionRoot: FsDirHandle
	path: Path
	conflictResolver?: CopyOperationConflictResolver
}
export enum CopyEntryOperationStage {
	DISCOVERY = "discovery",
	COPYING = "copying",
}

export type CopyEntryOperationState =
	| {
			stage: CopyEntryOperationStage.DISCOVERY
			discoveredFiles: number
			discoveredDirs: number
	  }
	| {
			stage: CopyEntryOperationStage.COPYING
			discoveredFiles: number
			discoveredDirs: number

			totalFilesProcessed: number
			totalDirsProcessed: number
			totalBytesCopied: number

			totalFilesSkipped: number
			totalDirsSkipped: number

			currentFileBytesCopied: number
			currentInputFile: FsFileHandle | null
	  }
