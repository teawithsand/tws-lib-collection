import { Timestamp } from "./timestamp"

export interface Clock {
	readonly getNow: () => Timestamp
}

export type ClockSchedulingRef = {
	readonly cancel: () => void
}

export interface ClockScheduling extends Clock {
	readonly setInterval: (
		callback: () => void,
		interval: number,
	) => ClockSchedulingRef
	readonly setTimeout: (
		callback: () => void,
		timeout: number,
	) => ClockSchedulingRef
}
