/**
 * Enumeration of available log levels in order of severity.
 * Lower numeric values indicate higher severity.
 */
export enum LogLevel {
	/** Critical assertion failures that indicate program state violations */
	ASSERT,
	/** Error conditions that may cause application malfunction */
	ERROR,
	/** Warning conditions that indicate potential issues */
	WARN,
	/** General informational messages */
	INFO,
	/** Important notices that are more significant than info */
	NOTICE,
	/** Detailed verbose output for debugging purposes */
	VERBOSE,
}

/**
 * Converts a LogLevel enum value to its string representation.
 * @param level - The log level to convert
 * @returns The string representation of the log level
 * @throws Error if the provided log level is unknown
 */
export const logLevelToString = (level: LogLevel): string => {
	switch (level) {
		case LogLevel.ASSERT:
			return "ASSERT"
		case LogLevel.ERROR:
			return "ERROR"
		case LogLevel.WARN:
			return "WARN"
		case LogLevel.INFO:
			return "INFO"
		case LogLevel.NOTICE:
			return "NOTICE"
		case LogLevel.VERBOSE:
			return "VERBOSE"
		default:
			throw new Error(`Unknown log level: ${level}`)
	}
}

/**
 * Base logger interface that defines the core logging functionality.
 * All loggers must implement this interface to provide basic log message handling.
 */
export interface BaseLogger {
	/**
	 * Logs a message at the specified level.
	 * @param level - The severity level of the log message
	 * @param tag - Optional tag to prefix the log message
	 * @param message - The log message
	 * @param args - Additional arguments to include with the log message
	 */
	log: (
		level: LogLevel,
		tag: string,
		message: string,
		...args: unknown[]
	) => void
}

/**
 * Extended logger interface that provides convenience methods for different log levels.
 * Extends BaseLogger with level-specific methods and tagged logger creation.
 */
export interface Logger extends BaseLogger {
	/**
	 * Logs an assertion failure message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The assertion failure message
	 * @param args - Additional arguments to include with the log message
	 */
	assert: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Logs an error message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The error message
	 * @param args - Additional arguments to include with the log message
	 */
	error: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Logs a warning message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The warning message
	 * @param args - Additional arguments to include with the log message
	 */
	warn: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Logs an informational message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The informational message
	 * @param args - Additional arguments to include with the log message
	 */
	info: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Logs a notice message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The notice message
	 * @param args - Additional arguments to include with the log message
	 */
	notice: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Logs a verbose debug message.
	 * @param tag - Tag to prefix the log message
	 * @param message - The verbose debug message
	 * @param args - Additional arguments to include with the log message
	 */
	verbose: (tag: string, message: string, ...args: unknown[]) => void

	/**
	 * Creates a new tagged logger instance with the specified tag.
	 * Tagged loggers prefix all log messages with their tag for easier identification.
	 * @param tag - The tag to prefix all log messages with
	 * @returns A new TaggedLogger instance
	 */
	createTaggedLogger: (tag: string) => TaggedLogger
}

/**
 * Logger interface that includes a tag for prefixing log messages.
 * Extends Logger with a readonly tag property for message identification.
 */
export interface TaggedLogger {
	/** The tag that will be prefixed to all log messages from this logger */
	readonly tag: string

	/**
	 * Logs a message at the specified level.
	 * The tag is automatically prefixed to the message.
	 * @param level - The severity level of the log message
	 * @param message - The log message
	 * @param args - Additional arguments to include with the log message
	 */
	log: (level: LogLevel, message: string, ...args: unknown[]) => void

	/**
	 * Logs an assertion failure message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The assertion failure message
	 * @param args - Additional arguments to include with the log message
	 */
	assert: (message: string, ...args: unknown[]) => void

	/**
	 * Logs an error message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The error message
	 * @param args - Additional arguments to include with the log message
	 */
	error: (message: string, ...args: unknown[]) => void

	/**
	 * Logs a warning message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The warning message
	 * @param args - Additional arguments to include with the log message
	 */
	warn: (message: string, ...args: unknown[]) => void

	/**
	 * Logs an informational message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The informational message
	 * @param args - Additional arguments to include with the log message
	 */
	info: (message: string, ...args: unknown[]) => void

	/**
	 * Logs a notice message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The notice message
	 * @param args - Additional arguments to include with the log message
	 */
	notice: (message: string, ...args: unknown[]) => void

	/**
	 * Logs a verbose debug message.
	 * The tag is automatically prefixed to the message.
	 * @param message - The verbose debug message
	 * @param args - Additional arguments to include with the log message
	 */
	verbose: (message: string, ...args: unknown[]) => void
}
