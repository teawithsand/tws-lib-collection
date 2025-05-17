import {
	StickySubscribable,
	Subscribable,
	Subscriber,
	SubscriptionCanceler,
} from "./defines"

/**
 * Util for subscribables.
 */
export class SubscribableUtil {
	private constructor() {}

	/**
	 * Util method to make sure that emitEvent method is not typescript-visible.
	 */
	public static readonly hideEmitter = <T>(
		subscribable: Subscribable<T>,
	): Subscribable<T> => {
		return subscribable
	}

	/**
	 * Util method to make sure that emitEvent method is not typescript-visible.
	 * Used for StickySubscribable type.
	 */
	public static readonly hideStickyEmitter = <T>(
		subscribable: StickySubscribable<T>,
	): StickySubscribable<T> => {
		return subscribable
	}

	public static readonly pushingToArraySubscriber = <T>(
		res: T[],
	): Subscriber<T> => {
		return (event: T) => {
			res.push(event)
		}
	}

	public static readonly registerSelfCancellingSubscriber = <T>(
		bus: Subscribable<T>,
		subscriber: (event: T, cancel: SubscriptionCanceler) => void,
	) => {
		let cancel: SubscriptionCanceler = undefined as any
		cancel = bus.addSubscriber((event) => {
			if (!cancel) {
				throw new Error(`Triggered event handler before returning!`)
			}

			subscriber(event, cancel)
		})
	}
}
