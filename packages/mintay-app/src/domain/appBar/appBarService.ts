import { AppTransString } from "@/app"
import {
	AppBarAction,
	AppBarDrawerItem,
	AppBarMoreAction,
} from "@/components/appBar/appBarTypes"
import { atom } from "@teawithsand/fstate"

export interface AppBarState {
	title: AppTransString
	actions: AppBarAction[]
	moreActions: AppBarMoreAction[]
	drawerItems: AppBarDrawerItem[]
	drawerTitle: AppTransString
}

export type AppBarMutator = (state: Readonly<AppBarState>) => AppBarState

export interface AppBarMutatorEntry {
	mutator: AppBarMutator
	priority: number
	id: symbol
	sequence: number
}

export class AppBarService {
	private readonly _mutatorStack = atom<AppBarMutatorEntry[]>([])
	private readonly _baseState = atom<AppBarState>({
		title: (t) => t.appBar.title(),
		actions: [],
		moreActions: [],
		drawerItems: [],
		drawerTitle: (t) => t.appBar.navigation(),
	})
	private _sequenceCounter = 0

	public readonly currentAppBarState = atom((get) => {
		const baseState = get(this._baseState)
		const mutators = get(this._mutatorStack)

		// Sort mutators by priority (higher priority applied last), then by sequence for stable sorting
		const sortedMutators = [...mutators].sort((a, b) => {
			if (a.priority !== b.priority) {
				return a.priority - b.priority
			}
			return a.sequence - b.sequence
		})

		return sortedMutators.reduce(
			(state, entry) => entry.mutator(state),
			baseState,
		)
	})

	public readonly pushMutator = atom(
		null,
		(_get, set, mutator: AppBarMutator, priority: number = 0) => {
			const id = Symbol()
			const sequence = this._sequenceCounter++
			const entry: AppBarMutatorEntry = {
				mutator,
				priority,
				id,
				sequence,
			}
			set(this._mutatorStack, (prev) => [...prev, entry])
			return id
		},
	)

	public readonly removeMutator = atom(null, (_get, set, id: symbol) => {
		set(this._mutatorStack, (prev) =>
			prev.filter((entry) => entry.id !== id),
		)
	})

	public readonly clearMutators = atom(null, (_get, set) => {
		set(this._mutatorStack, [])
	})

	public readonly setBaseState = atom(
		null,
		(_get, set, state: AppBarState) => {
			set(this._baseState, state)
		},
	)
}
