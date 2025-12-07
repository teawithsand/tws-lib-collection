import { atom, JotaiStore, WritableAtom } from "@teawithsand/fstate"
import {
	OperationHandle,
	OperationRunner,
	OperationStatus,
} from "../../commonDefines"
import {
	UploadBlobInput,
	UploadBlobsOperationArgs,
	UploadBlobsOperationStage,
	UploadBlobsOperationState,
} from "../defines"
import { FileManagerUploadOperationError } from "../error"
import { writeBlobToDirectoryChunked } from "../helpers/writing"

const DEFAULT_CHUNK_SIZE = 16 * 1024

type UploadStateAtom = WritableAtom<
	UploadBlobsOperationState,
	[UploadBlobsOperationState],
	void
>

type UploadOperationAtoms = {
	readonly stateAtom: UploadStateAtom
	readonly statusAtom: WritableAtom<OperationStatus, [OperationStatus], void>
	readonly errorAtom: WritableAtom<unknown | null, [unknown | null], void>
	readonly interruptAtom: WritableAtom<null, [], void>
}

type InterruptionTracker = {
	interrupted: boolean
}

class UploadBlobsOperationSession {
	public constructor(
		private readonly store: JotaiStore,
		private readonly args: UploadBlobsOperationArgs,
	) {
		this.chunkSize = this.resolveChunkSize()
		this.totalBytesToWrite = this.calculateTotalBytesToWrite()
		this.interruption = { interrupted: false }
		this.atoms = this.createOperationAtoms()
	}

	public readonly start = (): OperationHandle<UploadBlobsOperationState> => {
		const operationPromise = this.run()
		return {
			operationPromise,
			state: this.atoms.stateAtom,
			status: this.atoms.statusAtom,
			error: this.atoms.errorAtom,
			interrupt: this.atoms.interruptAtom,
		}
	}

	private readonly chunkSize: number
	private readonly totalBytesToWrite: number
	private readonly interruption: InterruptionTracker
	private readonly atoms: UploadOperationAtoms

	private readonly run = async (): Promise<void> => {
		try {
			for (const input of this.args.input) {
				this.checkInterruption()
				await this.uploadSingleBlob(input)
			}
			this.store.set(this.atoms.statusAtom, OperationStatus.SUCCEEDED)
		} catch (error) {
			this.handleOperationError(error)
			throw error
		}
	}

	private readonly resolveChunkSize = (): number => {
		const chunkSize = this.args.chunkSize ?? DEFAULT_CHUNK_SIZE
		if (chunkSize <= 0) {
			throw new FileManagerUploadOperationError(
				"Chunk size must be positive",
			)
		}
		return chunkSize
	}

	private readonly calculateTotalBytesToWrite = (): number =>
		this.args.input.reduce(
			(total, item) => total + (item.blob.size ?? 0),
			0,
		)

	private readonly createOperationAtoms = (): UploadOperationAtoms => {
		const stateAtom = atom<UploadBlobsOperationState>({
			stage: UploadBlobsOperationStage.UPLOADING,
			totalBlobs: this.args.input.length,
			processedBlobs: 0,
			totalBytesWritten: 0,
			totalBytesToWrite: this.totalBytesToWrite,
			currentFileName: null,
			currentBlobBytesWritten: 0,
		})

		const statusAtom = atom<OperationStatus>(OperationStatus.PENDING)
		const errorAtom = atom<unknown | null>(null)
		const interruptAtom = atom(null, () => {
			this.interruption.interrupted = true
		})

		return {
			stateAtom,
			statusAtom,
			errorAtom,
			interruptAtom,
		}
	}

	private readonly checkInterruption = (): void => {
		if (this.interruption.interrupted) {
			throw new FileManagerUploadOperationError("Operation interrupted")
		}
	}

	private readonly uploadSingleBlob = async (
		input: UploadBlobInput,
	): Promise<void> => {
		this.setCurrentFile(input.fileName)
		this.resetCurrentBlobProgress()

		await writeBlobToDirectoryChunked(
			this.args.output,
			input.fileName,
			input.blob,
			this.chunkSize,
			(bytes) => this.onChunkWritten(bytes),
			this.checkInterruption,
		)

		this.incrementProcessed()
		this.clearCurrentFile()
	}

	private readonly setCurrentFile = (fileName: string): void => {
		const state = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...state,
			currentFileName: fileName,
		})
	}

	private readonly resetCurrentBlobProgress = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...state,
			currentBlobBytesWritten: 0,
		})
	}

	private readonly onChunkWritten = (bytes: number): void => {
		const state = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...state,
			currentBlobBytesWritten: state.currentBlobBytesWritten + bytes,
			totalBytesWritten: state.totalBytesWritten + bytes,
		})
	}

	private readonly incrementProcessed = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...state,
			processedBlobs: state.processedBlobs + 1,
		})
	}

	private readonly clearCurrentFile = (): void => {
		const state = this.store.get(this.atoms.stateAtom)
		this.store.set(this.atoms.stateAtom, {
			...state,
			currentFileName: null,
			currentBlobBytesWritten: 0,
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
}

/**
 * Uploads blobs to a directory, supporting per-blob naming, chunked writes, and progress tracking.
 */
export class UploadBlobsOperationRunner
	implements
		OperationRunner<UploadBlobsOperationState, UploadBlobsOperationArgs>
{
	/**
	 * Creates upload operation runner bound to jotai store.
	 *
	 * @param store jotai store used for atom reads/writes during operations
	 */
	public constructor(private readonly store: JotaiStore) {}

	/**
	 * Starts upload of provided blobs into output directory.
	 */
	public readonly runOperation = (
		args: UploadBlobsOperationArgs,
	): OperationHandle<UploadBlobsOperationState> => {
		return new UploadBlobsOperationSession(this.store, args).start()
	}
}
