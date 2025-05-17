import { EventBus, Subscriber, SubscriptionCanceler } from "./defines"

/**
 * Simplest and default implementation of event bus.
 * Not the most performant one, but fully deterministic.
 */
export class DefaultEventBus<T> implements EventBus<T> {
	// Can't use forEach without copy, since .forEach method at least
	// has this weird quirk that causes some elements to be skipped if array gets modified in between calls.
	// That's why this array must stay immutable.
	// This I guess depends on actual implementation of this method in your JS engine, so YMMV

	private subscribers: Subscriber<T>[] = []

	emitEvent = (event: T) => {
		const subscribers = this.subscribers
		for (const subscriber of subscribers) {
			subscriber(event)
		}
	}

	addSubscriber = (subscriber: Subscriber<T>): SubscriptionCanceler => {
		this.subscribers = [...this.subscribers, subscriber]

		return () => this.removeSubscriber(subscriber)
	}

	private removeSubscriber = (subscriber: Subscriber<T>) => {
		this.subscribers = this.subscribers.filter((x) => x !== subscriber)
	}
}
