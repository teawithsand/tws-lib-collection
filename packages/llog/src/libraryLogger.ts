import { ConsoleBaseLogger } from "./consoleLogger"
import { BaseLogger, LogLevel } from "./types"

export class LibraryBaseLogger implements BaseLogger {
	private static readonly masterLogger: BaseLogger = new ConsoleBaseLogger()
	private static readonly libraryLoggerOverrides: Map<string, BaseLogger> =
		new Map()

	/**
	 * Gets the master logger instance
	 */
	public static readonly getMasterLogger = (): BaseLogger => {
		return LibraryBaseLogger.masterLogger
	}

	/**
	 * Sets a logger for a specific library
	 */
	public static readonly setLibraryLogger = (
		libraryName: string,
		logger: BaseLogger,
	): void => {
		LibraryBaseLogger.libraryLoggerOverrides.set(libraryName, logger)
	}

	/**
	 * Gets the logger for a specific library, or the master logger if none is set
	 */
	public static readonly getLibraryLogger = (
		libraryName: string,
	): BaseLogger => {
		return (
			LibraryBaseLogger.libraryLoggerOverrides.get(libraryName) ??
			LibraryBaseLogger.masterLogger
		)
	}

	/**
	 * Gets all library logger overrides
	 */
	public static readonly getLibraryLoggerOverrides = (): Map<
		string,
		BaseLogger
	> => {
		return new Map(LibraryBaseLogger.libraryLoggerOverrides)
	}

	/**
	 * Removes a logger override for a specific library
	 */
	public static readonly removeLibraryLogger = (
		libraryName: string,
	): boolean => {
		return LibraryBaseLogger.libraryLoggerOverrides.delete(libraryName)
	}

	/**
	 * Clears all library logger overrides
	 */
	public static readonly clearLibraryLoggers = (): void => {
		LibraryBaseLogger.libraryLoggerOverrides.clear()
	}

	/**
	 * Creates a new library logger instance for the specified library
	 * @param libraryName - The name of the library this logger is for
	 */
	constructor(public readonly libraryName: string) {}

	/**
	 * Logs a message at the specified level using the appropriate logger for this library
	 * @param level - The log level
	 * @param tag - Optional tag to prefix the log message
	 * @param message - The message to log
	 * @param args - Additional arguments to pass to the logger
	 */
	log = (
		level: LogLevel,
		tag: string,
		message: string,
		...args: unknown[]
	) => {
		const logger = LibraryBaseLogger.getLibraryLogger(this.libraryName)
		logger.log(level, tag, message, ...args)
	}
}
