/**
 * Operation runner which removes a single handle and its children.
 */
import {
	atom,
	FsDirHandle,
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
import {
	RemoveEntryOperationArgs,
	RemoveEntryOperationStage,
	RemoveEntryOperationState,
} from "../defines"
import { FileManagerRemoveOperationError } from "../error"
import { discoverHandle, DiscoveryResult } from "../helpers/discovery"
import { removeDirectory, removeFile } from "../helpers/removal"

type RemoveStateAtom = ReturnType<typeof atom<RemoveEntryOperationState>>
type RemoveStatusAtom = ReturnType<typeof atom<OperationStatus>>
type RemoveErrorAtom = ReturnType<typeof atom<unknown | null>>

type RemoveAtoms = {
	readonly stateAtom: RemoveStateAtom
	readonly statusAtom: RemoveStatusAtom
	readonly errorAtom: RemoveErrorAtom
	readonly interruptAtom: ReturnType<typeof atom<null, [], void>>
}

type RemoveInterruption = {
	interrupted: boolean
}

class RemoveEntryOperationSession {
	public constructor(
		private readonly store: JotaiStore,
		private readonly args: RemoveEntryOperationArgs,
	) {
		this.interruption = { interrupted: false }
		this.atoms = this.createAtoms()
	}

	public readonly start = (): OperationHandle<RemoveEntryOperationState> => ({
		operationPromise: this.run(),
		state: this.atoms.stateAtom,
		status: this.atoms.statusAtom,
		error: this.atoms.errorAtom,
		interrupt: this.atoms.interruptAtom,
	})

	private readonly atoms: RemoveAtoms
	private readonly interruption: RemoveInterruption

	private readonly run = async (): Promise<void> => {
		try {
			const discoveryResults: DiscoveryResult[] = []

			this.checkInterruption()
			await discoverHandle(
				this.args.input,
				this.resolveRelativePath(),
				discoveryResults,
				this.checkInterruption,
				this.incrementDiscoveredFiles,
				this.incrementDiscoveredDirs,
			)

			this.transitionToRemovalStage(discoveryResults)
			await this.removeHandles(discoveryResults)
			this.store.set(this.atoms.statusAtom, OperationStatus.SUCCEEDED)
		} catch (error) {
			this.handleOperationError(error)
			throw error
		}
	}

	private readonly resolveRelativePath = (): Path =>
		this.args.relativePath ?? Path.fromSegment(this.args.input.name)

	private readonly createAtoms = (): RemoveAtoms => {
		const stateAtom = atom<RemoveEntryOperationState>({
			stage: RemoveEntryOperationStage.DISCOVERY,
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
			throw new FileManagerRemoveOperationError("Operation interrupted")
		}
	}

	private readonly transitionToRemovalStage = (
		discoveryResults: DiscoveryResult[],
	): void => {
		this.store.set(this.atoms.stateAtom, {
			stage: RemoveEntryOperationStage.REMOVAL,
			discoveredDirs: discoveryResults.filter(
				(result) => result.handle.type === FsHandleType.DIR,
			).length,
			discoveredFiles: discoveryResults.filter(
				(result) => result.handle.type === FsHandleType.FILE,
			).length,
			totalDirsRemoved: 0,
			totalFilesRemoved: 0,
			totalDirsSkipped: 0,
			totalFilesSkipped: 0,
			currentHandle: null,
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

	private readonly removeHandles = async (
		discoveryResults: DiscoveryResult[],
	): Promise<void> => {
		const sortedResults = this.sortResultsForRemoval(discoveryResults)

		for (const { handle } of sortedResults) {
			this.checkInterruption()
			const state = this.store.get(this.atoms.stateAtom)
			if (state.stage !== RemoveEntryOperationStage.REMOVAL) {
				return
			}

			if (handle.type === FsHandleType.FILE) {
				await removeFile(
					handle as FsFileHandle,
					this.updateCurrentHandle,
					this.clearCurrentHandle,
					this.incrementFilesRemoved,
					this.incrementFilesSkipped,
				)
			} else if (handle.type === FsHandleType.DIR) {
				await removeDirectory(
					handle as FsDirHandle,
					this.updateCurrentHandle,
					this.clearCurrentHandle,
					this.incrementDirsRemoved,
					this.incrementDirsSkipped,
				)
			}
		}
	}

	private readonly updateCurrentHandle = (handle: FsHandle): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				currentHandle: handle,
			})
		}
	}

	private readonly clearCurrentHandle = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				currentHandle: null,
			})
		}
	}

	private readonly incrementFilesRemoved = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalFilesRemoved: state.totalFilesRemoved + 1,
			})
		}
	}

	private readonly incrementDirsRemoved = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalDirsRemoved: state.totalDirsRemoved + 1,
			})
		}
	}

	private readonly incrementFilesSkipped = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalFilesSkipped: state.totalFilesSkipped + 1,
			})
		}
	}

	private readonly incrementDirsSkipped = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				totalDirsSkipped: state.totalDirsSkipped + 1,
			})
		}
	}

	private readonly sortResultsForRemoval = (
		results: DiscoveryResult[],
	): DiscoveryResult[] => {
		return [...results].sort((left, right) => {
			const depthDiff =
				right.relativePath.getSegments().length -
				left.relativePath.getSegments().length
			if (depthDiff !== 0) {
				return depthDiff
			}

			if (
				left.handle.type === FsHandleType.FILE &&
				right.handle.type === FsHandleType.DIR
			) {
				return -1
			}
			if (
				left.handle.type === FsHandleType.DIR &&
				right.handle.type === FsHandleType.FILE
			) {
				return 1
			}
			return 0
		})
	}
}

export class RemoveEntryOperationRunner
	implements
		OperationRunner<RemoveEntryOperationState, RemoveEntryOperationArgs>
{
	/**
	 * Creates remove operation runner bound to jotai store.
	 */
	public constructor(private readonly store: JotaiStore) {}

	/**
	 * Starts removal of provided handle.
	 */
	public readonly runOperation = (
		args: RemoveEntryOperationArgs,
	): OperationHandle<RemoveEntryOperationState> => {
		return new RemoveEntryOperationSession(this.store, args).start()
	}
}
