import { Loadable } from "../../jotai"
import { Atom, atom, JotaiStore, loadable, WritableAtom } from "../../libs"
import { ConfigSpec, ConsistentConfigAtoms } from "../types"

export class ConfigAtomsHelper<T extends Record<string, unknown>> {
	private readonly spec
	private readonly store
	public readonly consistentAtoms
	public readonly eventuallyConsistentAtoms
	public readonly loadableConsistentAtoms

	constructor({ spec, store }: { spec: ConfigSpec<T>; store: JotaiStore }) {
		this.spec = spec
		this.store = store

		this.consistentAtoms = this.makeInitialConsistentAtoms()
		this.eventuallyConsistentAtoms =
			this.makeInitialEventuallyConsistentAtoms()

		this.loadableConsistentAtoms = this.makeLoadableAtoms(
			this.consistentAtoms,
		)
	}

	public readonly loadValue = <E extends keyof T>(
		key: E,
		valuePromise: Promise<T[E]>,
	) => {
		this.store.set(this.consistentAtoms[key], valuePromise)

		// TODO(teawithsand): this creates "leaked" promises, which should be caught
		//  and awaited via some kind of release() method
		//  In the future it should be refactored to do just that.
		valuePromise
			.then((v) => {
				this.store.set(this.eventuallyConsistentAtoms[key], v)
			})
			.catch(() => {
				// Ignore. Eventually consistent in that case should hold last consistent state
			})
	}

	private readonly makeInitialConsistentAtoms = () => {
		const res = {} as {
			[K in keyof T]: WritableAtom<Promise<T[K]>, [Promise<T[K]>], void>
		}

		for (const key in this.spec) {
			res[key] = atom(
				Promise.resolve(this.spec[key].defaultValue) as Promise<
					T[typeof key]
				>,
			)
		}
		return res
	}

	private readonly makeInitialEventuallyConsistentAtoms = () => {
		const res = {} as {
			[K in keyof T]: WritableAtom<T[K], [T[K]], void>
		}

		for (const key in this.spec) {
			res[key] = atom(this.spec[key].defaultValue)
		}
		return res
	}

	private readonly makeLoadableAtoms = (atoms: ConsistentConfigAtoms<T>) => {
		const res = {} as {
			[K in keyof T]: Atom<Loadable<T[K]>>
		}

		for (const key in atoms) {
			res[key] = loadable(atoms[key])
		}
		return res
	}
}
