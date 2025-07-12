import { ClockScheduling, ClockSchedulingRef } from "./clock"
import { Timestamp } from "./timestamp"

export class DefaultClock implements ClockScheduling {
	private constructor() {}

	public static readonly instance = new DefaultClock()

	public static readonly getInstance = () => {
		return this.instance
	}

	public readonly setInterval = (
		callback: () => void,
		interval: number,
	): ClockSchedulingRef => {
		const handle = setInterval(callback, interval)

		return {
			cancel: () => {
				clearInterval(handle)
			},
		}
	}

	public readonly setTimeout = (
		callback: () => void,
		interval: number,
	): ClockSchedulingRef => {
		const handle = setTimeout(callback, interval)

		return {
			cancel: () => {
				clearTimeout(handle)
			},
		}
	}

	public readonly getNow = () => Timestamp.fromDate(new Date())
}
