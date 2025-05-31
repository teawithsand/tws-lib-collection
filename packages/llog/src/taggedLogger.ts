import { LogLevel, Logger, TaggedLogger } from "./types"

/**
 * A logger wrapper that prepends a tag to all messages from a wrapped logger.
 */
export class TaggedLoggerImpl implements TaggedLogger {
	/**
	 * The tag attached to this logger.
	 */
	public readonly tag: string
	private readonly wrappedLogger: Logger

	/**
	 * Creates an instance of TaggedLoggerWrapper.
	 * @param params - The parameters for creating a TaggedLoggerWrapper.
	 * @param params.tag - The tag to prepend to messages.
	 * @param params.loggerToWrap - The logger instance to wrap.
	 */
	constructor({ tag, logger }: { tag: string; logger: Logger }) {
		this.tag = tag
		this.wrappedLogger = logger
	}

	/**
	 * Logs a message with the specified log level, prepending the tag.
	 * @param level - The log level.
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly log = (
		level: LogLevel,
		message: string,
		...args: unknown[]
	): void => {
		this.wrappedLogger.log(level, this.tag, message, ...args)
	}

	/**
	 * Logs an assertion, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly assert = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.ASSERT, this.tag, message, ...args)
	}

	/**
	 * Logs an error message, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly error = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.ERROR, this.tag, message, ...args)
	}

	/**
	 * Logs a warning message, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly warn = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.WARN, this.tag, message, ...args)
	}

	/**
	 * Logs an informational message, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly info = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.INFO, this.tag, message, ...args)
	}

	/**
	 * Logs a notice message, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly notice = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.NOTICE, this.tag, message, ...args)
	}

	/**
	 * Logs a verbose message, prepending the tag.
	 * @param tag - Optional additional tag to prefix the log message
	 * @param message - The message to log.
	 * @param args - Additional arguments to log.
	 */
	public readonly verbose = (message: string, ...args: unknown[]): void => {
		this.log(LogLevel.VERBOSE, this.tag, message, ...args)
	}
}
