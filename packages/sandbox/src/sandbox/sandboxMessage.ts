import { ConsoleLogLevel } from "./childMessage"

export enum SandboxMessageType {
	ERROR = "error",
	UNHANDLED_REJECTION = "unhandledRejection",
	CONSOLE = "console",
}

/**
 * Represents a message sent from the sandbox, matching the structure of child messages.
 */
export type SandboxMessage =
	| {
			type: SandboxMessageType.CONSOLE
			level: ConsoleLogLevel
			args: unknown[]
			timestamp: number
	  }
	| {
			type: SandboxMessageType.UNHANDLED_REJECTION
			reason: unknown
			promise?: string
			timestamp: number
	  }
	| {
			type: SandboxMessageType.ERROR
			message: string
			filename?: string
			stack?: string
			timestamp: number
	  }
