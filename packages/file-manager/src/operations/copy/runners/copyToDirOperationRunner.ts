import {
	atom,
	FsFileHandle,
	FsHandle,
	FsHandleType,
	JotaiStore,
	Path,
} from "@teawithsand/fstate"
import {
	OperationHandle,
	OperationRunner,
	OperationStatus,
} from "../../commonDefines"
import { FileAlreadyExistConflictResolutionType } from "../../conflict"
import {
	CopyOperationConflictResolver,
	CopyToDirOperationArgs,
	CopyToDirOperationStage,
	CopyToDirOperationState,
} from "../defines"
import { FileManagerCopyOperationError } from "../error"
import { copyDirectory, copyFile } from "../helpers/copying"
import { discoverHandle, DiscoveryResult } from "../helpers/discovery"

const DEFAULT_CONFLICT_RESOLVER: CopyOperationConflictResolver = {
	resolveFileAlreadyExistConflict: async () => ({
		type: FileAlreadyExistConflictResolutionType.ERROR,
	}),
}

type CopyStateAtom = ReturnType<typeof atom<CopyToDirOperationState>>
type CopyStatusAtom = ReturnType<typeof atom<OperationStatus>>
type CopyErrorAtom = ReturnType<typeof atom<unknown | null>>

type CopyAtoms = {
	readonly stateAtom: CopyStateAtom
	readonly statusAtom: CopyStatusAtom
	readonly errorAtom: CopyErrorAtom
	readonly interruptAtom: ReturnType<typeof atom<null, [], void>>
}

type CopyInterruption = {
	interrupted: boolean
}

class CopyToDirOperationSession {
	public constructor(
		private readonly store: JotaiStore,
		private readonly args: CopyToDirOperationArgs,
		private readonly defaultConflictResolver: CopyOperationConflictResolver,
	) {
		this.interruption = { interrupted: false }
		this.atoms = this.createAtoms()
	}

	public readonly start = (): OperationHandle<CopyToDirOperationState> => ({
		operationPromise: this.run(),
		state: this.atoms.stateAtom,
		status: this.atoms.statusAtom,
		error: this.atoms.errorAtom,
		interrupt: this.atoms.interruptAtom,
	})

	private readonly atoms: CopyAtoms
	private readonly interruption: CopyInterruption

	private readonly run = async (): Promise<void> => {
		try {
			const discoveryResults: DiscoveryResult[] = []

			for (const handle of this.args.input) {
				this.checkInterruption()
				await discoverHandle(
					handle,
					Path.fromSegment(handle.name),
					discoveryResults,
					() => this.checkInterruption(),
					() => this.incrementDiscoveredFiles(),
					() => this.incrementDiscoveredDirs(),
				)
			}

			this.transitionToCopyingStage(discoveryResults)

			for (const { handle, relativePath } of discoveryResults) {
				this.checkInterruption()
				await this.copyHandle(handle, relativePath)
			}
			this.store.set(this.atoms.statusAtom, OperationStatus.SUCCEEDED)
		} catch (error) {
			this.handleOperationError(error)
			throw error
		}
	}

	private readonly createAtoms = (): CopyAtoms => {
		const stateAtom = atom<CopyToDirOperationState>({
			stage: CopyToDirOperationStage.DISCOVERY,
			discoveredDirs: 0,
			discoveredFiles: 0,
		})

		const statusAtom = atom<OperationStatus>(OperationStatus.PENDING)
		const errorAtom = atom<unknown | null>(null)
		const interruptAtom = atom<null, [], void>(null, () => {
			this.interruption.interrupted = true
		})

		return { stateAtom, statusAtom, errorAtom, interruptAtom }
	}

	private readonly checkInterruption = (): void => {
		if (this.interruption.interrupted) {
			throw new FileManagerCopyOperationError("Operation interrupted")
		}
	}

	private readonly transitionToCopyingStage = (
		discoveryResults: DiscoveryResult[],
	): void => {
		this.store.set(this.atoms.stateAtom, {
			stage: CopyToDirOperationStage.COPYING,
			discoveredDirs: discoveryResults.filter(
				(r) => r.handle.type === FsHandleType.DIR,
			).length,
			discoveredFiles: discoveryResults.filter(
				(r) => r.handle.type === FsHandleType.FILE,
			).length,
			totalBytesCopied: 0,
			totalDirsProcessed: 0,
			totalFilesProcessed: 0,
			totalDirsSkipped: 0,
			totalFilesSkipped: 0,
			currentFileBytesCopied: 0,
			currentInputFile: null,
		})
	}

	private readonly handleOperationError = (error: unknown): void => {
		if (this.interruption.interrupted) {
			this.store.set(this.atoms.statusAtom, OperationStatus.INTERRUPTED)
		} else {
			this.store.set(this.atoms.statusAtom, OperationStatus.ERRORED)
			this.store.set(this.atoms.errorAtom, error)
		}
	}

	private readonly incrementDiscoveredFiles = (): void => {
		const currentState = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...currentState,
			discoveredFiles: currentState.discoveredFiles + 1,
		})
	}

	private readonly incrementDiscoveredDirs = (): void => {
		const currentState = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...currentState,
			discoveredDirs: currentState.discoveredDirs + 1,
		})
	}

	private readonly copyHandle = async (
		handle: FsHandle,
		relativePath: Path,
	): Promise<void> => {
		this.checkInterruption()

		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage !== CopyToDirOperationStage.COPYING) return

		const resolver =
			this.args.conflictResolver ?? this.defaultConflictResolver

		if (handle.type === FsHandleType.DIR) {
			await copyDirectory(
				this.args.output,
				relativePath,
				resolver,
				() => this.incrementDirectoriesProcessed(),
				() => this.incrementDirectoriesSkipped(),
			)
		} else if (handle.type === FsHandleType.FILE) {
			await copyFile(
				handle as FsFileHandle,
				this.args.output,
				relativePath,
				resolver,
				(fileHandle) => this.updateCurrentFile(fileHandle),
				(bytesCopied) => this.updateFileProgress(bytesCopied),
				() => this.incrementFilesSkipped(),
			)
		}
	}

	private readonly updateCurrentFile = (fileHandle: FsFileHandle): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === CopyToDirOperationStage.COPYING) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				currentInputFile: fileHandle,
				currentFileBytesCopied: 0,
			})
		}
	}

	private readonly updateFileProgress = (bytesCopied: number): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === CopyToDirOperationStage.COPYING) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalFilesProcessed: state.totalFilesProcessed + 1,
				totalBytesCopied: state.totalBytesCopied + bytesCopied,
				currentFileBytesCopied: bytesCopied,
				currentInputFile: null,
			})
		}
	}

	private readonly incrementDirectoriesProcessed = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === CopyToDirOperationStage.COPYING) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalDirsProcessed: state.totalDirsProcessed + 1,
			})
		}
	}

	private readonly incrementDirectoriesSkipped = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === CopyToDirOperationStage.COPYING) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalDirsSkipped: state.totalDirsSkipped + 1,
			})
		}
	}

	private readonly incrementFilesSkipped = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === CopyToDirOperationStage.COPYING) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalFilesSkipped: state.totalFilesSkipped + 1,
			})
		}
	}
}

export class CopyToDirOperationRunner
	implements OperationRunner<CopyToDirOperationState, CopyToDirOperationArgs>
{
	public constructor(
		private readonly store: JotaiStore,
		private readonly defaultConflictResolver: CopyOperationConflictResolver = DEFAULT_CONFLICT_RESOLVER,
	) {}

	public readonly runOperation = (
		args: CopyToDirOperationArgs,
	): OperationHandle<CopyToDirOperationState> => {
		return new CopyToDirOperationSession(
			this.store,
			args,
			this.defaultConflictResolver,
		).start()
	}
}
