import { Atom, WritableAtom } from "@teawithsand/fstate"

export enum OperationStatus {
	PENDING = "pending",
	INTERRUPTED = "interrupted",
	ERRORED = "errored",
	SUCCEEDED = "succeeded",
}

export type OperationExitData<T> = {
	state: T
	error: unknown | null
}

export interface OperationHandle<T> {
	operationPromise: Promise<void>

	state: Atom<T>
	status: Atom<OperationStatus>
	error: Atom<unknown | null>
	interrupt: WritableAtom<void, [], void>
}

export interface OperationRunner<S, I> {
	runOperation: (args: I) => OperationHandle<S>
}
