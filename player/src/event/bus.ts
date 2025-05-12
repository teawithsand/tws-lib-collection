type Callback<Arg> = (arg: Arg) => void

export class EventBus<Events extends Record<string, unknown>> {
	private readonly events: Map<keyof Events, Callback<unknown>[]>

	constructor() {
		this.events = new Map()
	}

	on = <K extends keyof Events>(
		eventName: K,
		callback: Callback<Events[K]>,
	): void => {
		const callbacks = this.events.get(eventName)
		if (callbacks) {
			if (!callbacks.includes(callback as Callback<unknown>)) {
				callbacks.push(callback as Callback<unknown>)
			}
		} else {
			this.events.set(eventName, [callback as Callback<unknown>])
		}
	}

	off = <K extends keyof Events>(
		eventName: K,
		callback: Callback<Events[K]>,
	): void => {
		const callbacks = this.events.get(eventName)
		if (!callbacks) return

		this.events.set(
			eventName,
			callbacks.filter((cb) => cb !== (callback as Callback<unknown>)),
		)

		if (this.events.get(eventName)?.length === 0) {
			this.events.delete(eventName)
		}
	}

	emit<K extends keyof Events>(eventName: K, event: Events[K]): void {
		const callbacks = this.events.get(eventName)
		if (!callbacks) return

		for (const callback of callbacks) {
			;(callback as Callback<Events[K]>)(event)
		}
	}
}
