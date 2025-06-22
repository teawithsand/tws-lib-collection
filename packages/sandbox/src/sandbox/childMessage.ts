import { z } from "zod"

/**
 * Console log levels supported by the sandbox
 */
export enum ConsoleLogLevel {
	LOG = "log",
	WARN = "warn",
	ERROR = "error",
}

/**
 * Schema for console message data
 */
export const childConsoleMessageSchema = z.object({
	type: z.literal("console"),
	level: z.nativeEnum(ConsoleLogLevel),
	args: z.array(z.any()),
	timestamp: z.number(),
})

/**
 * Schema for unhandled promise rejection events
 */
export const childUnhandledRejectionMessageSchema = z.object({
	type: z.literal("unhandledRejection"),
	reason: z.any(),
	promise: z.string().optional(), // Serialized promise info if available
	timestamp: z.number(),
})

/**
 * Schema for unhandled error events
 */
export const childUnhandledErrorMessageSchema = z.object({
	type: z.literal("unhandledError"),
	message: z.string(),
	filename: z.string().optional(),
	stack: z.string().optional(),
	timestamp: z.number(),
})

/**
 * Schema for iframe load event
 */
export const childLoadMessageSchema = z.object({
	type: z.literal("load"),
	timestamp: z.number(),
})

/**
 * Schema for DOM content loaded event
 */
export const childDomContentLoadedMessageSchema = z.object({
	type: z.literal("domContentLoaded"),
	timestamp: z.number(),
})

/**
 * Union of all possible child messages
 */
export const childMessageSchema = z.union([
	childConsoleMessageSchema,
	childUnhandledRejectionMessageSchema,
	childUnhandledErrorMessageSchema,
	childLoadMessageSchema,
	childDomContentLoadedMessageSchema,
])

/**
 * Type definitions inferred from schemas
 */
export type ChildConsoleMessage = z.infer<typeof childConsoleMessageSchema>
export type ChildUnhandledRejectionMessage = z.infer<
	typeof childUnhandledRejectionMessageSchema
>
export type ChildUnhandledErrorMessage = z.infer<
	typeof childUnhandledErrorMessageSchema
>
export type ChildLoadMessage = z.infer<typeof childLoadMessageSchema>
export type ChildDomContentLoadedMessage = z.infer<
	typeof childDomContentLoadedMessageSchema
>
export type ChildMessage = z.infer<typeof childMessageSchema>
