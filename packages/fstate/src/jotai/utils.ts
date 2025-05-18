import { Atom, atom } from "jotai"
import { JotaiStore } from "../libs"
import { DefaultStickyEventBus, StickySubscribable } from "../subscribable"

/**
 * Utility class for creating and managing Jotai atoms based on sticky subscribable event buses.
 *
 * This class provides methods to create atoms that reflect the current state of sticky event buses,
 * with variants to safely subscribe and manage lifecycle within a Jotai store.
 */
export class AtomUtil {
	private constructor() {}

	/**
	 * Creates a Jotai atom from a sticky subscribable event bus.
	 *
	 * The created atom:
	 * - Has its initial value set to the last event from the sticky subscribable.
	 * - Updates its state automatically when new events are emitted by the bus.
	 * - When mounted, subscribes to the bus and updates on new events.
	 *
	 * ### Important Usage Notices:
	 * - The atom needs to be mounted (used in a React component or subscribed in a store) before reading its value,
	 *   to ensure it reflects the latest event. Otherwise, the value may be stale if the bus emits events before mounting.
	 *
	 * It's safe to use with react and all subscribing listeners, however it's not safe to use with `JotaiStore.get` method, unless
	 * at least one subscription is online.
	 *
	 * @param bus StickySubscribable<T> - The sticky event bus to wrap into a Jotai atom.
	 * @returns Atom<T> A Jotai atom reflecting the current event value from the bus.
	 */
	public static readonly stickySubscribableAtom = <T>(
		bus: StickySubscribable<T>,
	): Atom<T> => {
		const innerAtom = atom(bus.lastEvent)

		const resAtom = atom(
			(get) => get(innerAtom),
			(_get, set, value: T) => {
				set(innerAtom, value)
			},
		)

		resAtom.onMount = (setState) => {
			// Immediately update the state so on mount we have the latest event
			setState(bus.lastEvent)

			const unsubscribe = bus.addSubscriber((event) => {
				setState(event)
			})

			return () => {
				unsubscribe()
			}
		}

		return resAtom
	}

	/**
	 * Creates a Jotai atom from a sticky subscribable event bus in a safe manner by pre-subscribing it to a Jotai store.
	 *
	 * This method ensures the atom is mounted in the given store, preventing stale reads of the atom before usage.
	 * It returns a release function which can be called to unsubscribe and cleanup when the atom is no longer needed.
	 *
	 * ### Important Usage Notices:
	 * - This method requires a reference to the JotaiStore used in your application.
	 * - Always call the returned `release` function when done using the atom, to avoid memory leaks.
	 *
	 * @param bus StickySubscribable<T> - The sticky event bus to wrap.
	 * @param store JotaiStore - The Jotai store where the atom will be subscribed.
	 * @returns [atom: Atom<T>, release: () => void] Tuple where the atom is the created atom and release is a cleanup function.
	 */
	public static readonly stickySubscribableAtomSafe = <T>(
		bus: StickySubscribable<T>,
		store: JotaiStore,
	): [atom: Atom<T>, release: () => void] => {
		const atomInstance = AtomUtil.stickySubscribableAtom(bus)

		// Subscribe to atom to ensure it is mounted and updated within the store
		const release = store.sub(atomInstance, () => {
			// empty listener is sufficient to keep subscription alive
		})

		return [atomInstance, release]
	}

	/**
	 * Creates a Jotai atom with an imperative setter backed by a sticky event bus.
	 *
	 * The returned tuple contains:
	 * - an atom whose value starts as the given initial value and updates when setter is called.
	 * - a setter function to imperatively update the atom’s value, emitting an event on the underlying event bus.
	 *
	 * This is useful for stateful values that need external imperative updates reflected reactively.
	 *
	 * @param initValue T - The initial value of the atom.
	 * @returns [atom: Atom<T>, setter: (value: T) => void] The atom and the imperative setter function.
	 */
	public static readonly imperativeSetAtom = <T>(
		initValue: T,
	): [atom: Atom<T>, setter: (value: T) => void] => {
		const bus = new DefaultStickyEventBus(initValue)

		return [
			AtomUtil.stickySubscribableAtom(bus),
			(value: T) => {
				bus.emitEvent(value)
			},
		]
	}

	/**
	 * Creates a Jotai atom with an imperative setter backed by a sticky event bus, safely mounted on a given store.
	 *
	 * Useful when you want to create an imperative-set atom that is safely subscribed on a JotaiStore upfront.
	 * Returns a tuple with the atom, setter function, and a release function to unsubscribe from the store.
	 *
	 * ### Important Usage Notices:
	 * - Must provide the JotaiStore instance to safely manage subscriptions.
	 * - Remember to call the `release` method to avoid memory leaks when the atom is no longer needed.
	 *
	 * @param initValue T - Initial value of the atom.
	 * @param store JotaiStore - Store to subscribe the atom safely.
	 * @returns [atom: Atom<T>, setter: (value: T) => void, release: () => void]
	 */
	public static readonly imperativeSetAtomSafe = <T>(
		initValue: T,
		store: JotaiStore,
	): [atom: Atom<T>, setter: (value: T) => void, release: () => void] => {
		const bus = new DefaultStickyEventBus(initValue)

		const [atomInstance, release] = AtomUtil.stickySubscribableAtomSafe(
			bus,
			store,
		)

		return [
			atomInstance,
			(value: T) => {
				bus.emitEvent(value)
			},
			release,
		]
	}
}
