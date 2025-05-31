import { BaseLogger, LogLevel, logLevelToString } from "./types.js"

/**
 * A console-based implementation of BaseLogger that outputs log messages
 * to the browser console or Node.js console using appropriate methods.
 */
export class ConsoleBaseLogger implements BaseLogger {
	/**
	 * Logs a message at the specified log level using console methods.
	 * Maps log levels to appropriate console methods for better visibility.
	 */
	public readonly log = (
		level: LogLevel,
		tag: string | undefined,
		message: string,
		...args: unknown[]
	): void => {
		const levelString = logLevelToString(level)
		const tagPrefix = tag ? `[${tag}] ` : ""
		const formattedMessage = `[${levelString}] ${tagPrefix}${message}`

		switch (level) {
			case LogLevel.ASSERT:
				console.error(formattedMessage, ...args)
				break
			case LogLevel.ERROR:
				console.error(formattedMessage, ...args)
				break
			case LogLevel.WARN:
				console.warn(formattedMessage, ...args)
				break
			case LogLevel.INFO:
				console.log(formattedMessage, ...args)
				break
			case LogLevel.NOTICE:
				console.log(formattedMessage, ...args)
				break
			case LogLevel.VERBOSE:
				console.log(formattedMessage, ...args)
				break
			default:
				console.log(formattedMessage, ...args)
				break
		}
	}
}
