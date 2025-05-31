import { BaseLogger, LogLevel } from "./types.js"

/**
 * A base logger implementation that filters log messages based on a custom filter function.
 * Only logs messages that pass the filter criteria.
 */
export class FilteringBaseLogger implements BaseLogger {
	private filter: (
		level: LogLevel,
		tag: string,
		message: string,
		...args: unknown[]
	) => boolean
	private target: BaseLogger

	/**
	 * Creates a new FilteringBaseLogger instance.
	 * @param filter - Function that returns true if the message should be logged
	 * @param target - The target logger to forward filtered messages to
	 */
	constructor({
		filter,
		target,
	}: {
		filter: (
			level: LogLevel,
			tag: string,
			message: string,
			...args: unknown[]
		) => boolean
		target: BaseLogger
	}) {
		this.filter = filter
		this.target = target
	}

	/**
	 * Logs a message if it passes the filter criteria.
	 * @param level - The severity level of the log message
	 * @param tag - Optional tag to prefix the log message
	 * @param message - The log message
	 * @param args - Additional arguments to include with the log message
	 */
	public readonly log = (
		level: LogLevel,
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		if (this.filter(level, tag, message, ...args)) {
			this.target.log(level, tag, message, ...args)
		}
	}
}
