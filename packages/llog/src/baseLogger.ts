import { TaggedLoggerImpl } from "./taggedLogger"
import { BaseLogger, Logger, LogLevel, TaggedLogger } from "./types"

export class LoggerImpl implements Logger {
	constructor(private readonly baseLogger: BaseLogger) {}

	public readonly log = (
		level: LogLevel,
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.baseLogger.log(level, tag, message, ...args)
	}

	public readonly assert = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.ASSERT, tag, message, ...args)
	}

	public readonly error = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.ERROR, tag, message, ...args)
	}

	public readonly warn = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.WARN, tag, message, ...args)
	}

	public readonly info = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.INFO, tag, message, ...args)
	}

	public readonly notice = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.NOTICE, tag, message, ...args)
	}

	public readonly verbose = (
		tag: string,
		message: string,
		...args: unknown[]
	): void => {
		this.log(LogLevel.VERBOSE, tag, message, ...args)
	}

	public readonly createTaggedLogger = (tag: string): TaggedLogger => {
		return new TaggedLoggerImpl({
			tag,
			logger: this,
		})
	}
}
