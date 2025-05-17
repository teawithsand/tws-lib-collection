export type Subscriber<S> = (state: S) => void
export type SubscriptionCanceler = () => void

export interface Subscribable<T> {
	addSubscriber(subscriber: Subscriber<T>): SubscriptionCanceler
}

export interface StickySubscribable<T> extends Subscribable<T> {
	readonly lastEvent: T
}

export interface Emitter<T> {
	emitEvent(e: T): void
}
export interface EventBus<T> extends Emitter<T>, Subscribable<T> {}
export interface StickyEventBus<T> extends Emitter<T>, StickySubscribable<T> {}
