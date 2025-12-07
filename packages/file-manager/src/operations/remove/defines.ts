import { FsHandle, Path } from "@teawithsand/fstate"

export interface RemoveEntriesOperationArgs {
	input: FsHandle[]
}

export enum RemoveEntriesOperationStage {
	DISCOVERY = "discovery",
	REMOVAL = "removal",
}

export type RemoveEntriesOperationState =
	| {
			stage: RemoveEntriesOperationStage.DISCOVERY
			discoveredFiles: number
			discoveredDirs: number
	  }
	| {
			stage: RemoveEntriesOperationStage.REMOVAL
			discoveredFiles: number
			discoveredDirs: number
			totalFilesRemoved: number
			totalDirsRemoved: number
			totalFilesSkipped: number
			totalDirsSkipped: number
			currentHandle: FsHandle | null
	  }

export interface RemoveEntryOperationArgs {
	input: FsHandle
	relativePath?: Path
}

export enum RemoveEntryOperationStage {
	DISCOVERY = "discovery",
	REMOVAL = "removal",
}

export type RemoveEntryOperationState =
	| {
			stage: RemoveEntryOperationStage.DISCOVERY
			discoveredFiles: number
			discoveredDirs: number
	  }
	| {
			stage: RemoveEntryOperationStage.REMOVAL
			discoveredFiles: number
			discoveredDirs: number
			totalFilesRemoved: number
			totalDirsRemoved: number
			totalFilesSkipped: number
			totalDirsSkipped: number
			currentHandle: FsHandle | null
	  }
