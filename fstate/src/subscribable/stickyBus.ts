import { DefaultEventBus } from "./bus"
import { StickyEventBus } from "./defines"

/**
 * Simplest and default implementation of sticky event bus.
 * Not the most performant one, but fully deterministic.
 */
export class DefaultStickyEventBus<T> implements StickyEventBus<T> {
	private readonly eventBus
	public readonly addSubscriber

	constructor(private innerLastEvent: T) {
		this.eventBus = new DefaultEventBus<T>()
		this.addSubscriber = this.eventBus.addSubscriber.bind(this.eventBus)
	}

	get lastEvent() {
		return this.innerLastEvent
	}

	emitEvent = (event: T) => {
		this.innerLastEvent = event
		this.eventBus.emitEvent(event)
	}
}
