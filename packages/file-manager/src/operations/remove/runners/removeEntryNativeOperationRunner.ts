/**
 * Operation runner which tries native recursive removal first and falls back to regular remove operation.
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
import { RemoveEntryOperationRunner } from "./removeEntryOperationRunner"

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

class RemoveEntryNativeOperationSession {
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
			this.checkInterruption()
			await this.removeHandleNative(
				this.args.input,
				this.args.relativePath,
			)
			this.store.set(this.atoms.statusAtom, OperationStatus.SUCCEEDED)
		} catch (error) {
			this.handleOperationError(error)
		}
	}

	private readonly createAtoms = (): RemoveAtoms => {
		const stateAtom = atom<RemoveEntryOperationState>({
			stage: RemoveEntryOperationStage.REMOVAL,
			discoveredDirs: this.args.input.type === FsHandleType.DIR ? 1 : 0,
			discoveredFiles: this.args.input.type === FsHandleType.FILE ? 1 : 0,
			totalDirsRemoved: 0,
			totalFilesRemoved: 0,
			totalDirsSkipped: 0,
			totalFilesSkipped: 0,
			currentHandle: null,
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

	private readonly removeHandleNative = async (
		handle: FsHandle,
		relativePath?: Path,
	): Promise<void> => {
		this.store.set(this.atoms.stateAtom, (state) => ({
			...state,
			currentHandle: handle,
		}))

		try {
			if (handle.type === FsHandleType.FILE) {
				await (handle as FsFileHandle).delete()
				this.incrementFilesRemoved()
			} else if (handle.type === FsHandleType.DIR) {
				await (handle as FsDirHandle).delete(true)
				this.incrementDirsRemoved()
			}
			this.clearCurrentHandle()
		} catch {
			await this.runFallbackRemoval(handle, relativePath)
		}
	}

	private readonly runFallbackRemoval = async (
		handle: FsHandle,
		relativePath?: Path,
	): Promise<void> => {
		const fallbackRunner = new RemoveEntryOperationRunner(this.store)
		const fallbackHandle = fallbackRunner.runOperation({
			input: handle,
			relativePath: relativePath ?? Path.fromSegment(handle.name),
		})

		await fallbackHandle.operationPromise

		this.checkInterruption()

		const fallbackStatus = this.store.get(fallbackHandle.status)
		if (fallbackStatus === OperationStatus.SUCCEEDED) {
			if (handle.type === FsHandleType.FILE) {
				this.incrementFilesRemoved()
			} else if (handle.type === FsHandleType.DIR) {
				this.incrementDirsRemoved()
			}
		} else if (fallbackStatus === OperationStatus.INTERRUPTED) {
			throw new FileManagerRemoveOperationError("Operation interrupted")
		} else {
			const fallbackError = this.store.get(fallbackHandle.error)
			throw (
				fallbackError ??
				new FileManagerRemoveOperationError("Fallback remove failed")
			)
		}
	}

	private readonly handleOperationError = (error: unknown): void => {
		if (this.interruption.interrupted) {
			this.store.set(this.atoms.statusAtom, OperationStatus.INTERRUPTED)
		} else {
			this.store.set(this.atoms.statusAtom, OperationStatus.ERRORED)
			this.store.set(this.atoms.errorAtom, error)
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

	private readonly clearCurrentHandle = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		if (state.stage === RemoveEntryOperationStage.REMOVAL) {
			this.store.set(this.atoms.stateAtom, {
				...state,
				currentHandle: null,
			})
		}
	}
}

export class RemoveEntryNativeOperationRunner
	implements
		OperationRunner<RemoveEntryOperationState, RemoveEntryOperationArgs>
{
	public constructor(private readonly store: JotaiStore) {}

	public readonly runOperation = (
		args: RemoveEntryOperationArgs,
	): OperationHandle<RemoveEntryOperationState> => {
		return new RemoveEntryNativeOperationSession(this.store, args).start()
	}
}
