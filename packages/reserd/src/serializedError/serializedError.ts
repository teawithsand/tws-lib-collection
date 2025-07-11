import {
	BaseError,
	Errors,
	type StackFrame,
	globalEqualComparatorRegistry,
} from "@teawithsand/lngext"
import { z } from "zod"
import { SerializerUnknown } from "../serialization/serializer"

/**
 * Zod schema for validating StackFrame objects
 */
const stackFrameSchema = z.object({
	functionName: z.string().nullable(),
	fileName: z.string().nullable(),
	lineNumber: z.number().nullable(),
	columnNumber: z.number().nullable(),
	raw: z.string(),
})

/**
 * Stored representation of StackFrame for serialization
 */
type StackFrameStored = z.infer<typeof stackFrameSchema>

/**
 * Zod schema for validating SerializedError plain objects
 */
const serializedErrorStoredSchema: z.ZodType<SerializedErrorStored> = z.lazy(
	() =>
		z.object({
			type: z.string(),
			name: z.string().nullable(),
			message: z.string(),
			callStack: z.array(stackFrameSchema),
			rawStack: z.string().nullable(),
			causeChain: z.array(serializedErrorStoredSchema),
		}),
)

/**
 * Stored representation of SerializedError for serialization
 */
type SerializedErrorStored = {
	type: string
	name: string | null
	message: string
	callStack: StackFrameStored[]
	rawStack: string | null
	causeChain: SerializedErrorStored[]
}

/**
 * Represents a serialized error that captures all error information
 * without inheriting from Error or BaseError classes.
 * Used for storing and transmitting error information.
 */
export class SerializedError {
	/** The type of the error (result of typeof operator) */
	public readonly type: string

	/** The name of the error (if it's an instance of Error) */
	public readonly name: string | null

	/** The error message */
	public readonly message: string

	/** The parsed call stack */
	public readonly callStack: StackFrame[]

	/** Raw stack trace string */
	public readonly rawStack: string | null

	/** Serialized cause chain (if error is instance of BaseError) */
	public readonly causeChain: SerializedError[]

	/**
	 * Static serializer for converting between SerializedError and plain objects
	 */
	public static readonly serializer: SerializerUnknown<
		SerializedError,
		SerializedErrorStored
	> = {
		serialize: (owned: SerializedError): SerializedErrorStored => {
			return {
				type: owned.type,
				name: owned.name,
				message: owned.message,
				callStack: owned.callStack,
				rawStack: owned.rawStack,
				causeChain: owned.causeChain.map((cause) =>
					SerializedError.serializer.serialize(cause),
				),
			}
		},
		deserialize: (stored: unknown): SerializedError => {
			const validated = serializedErrorStoredSchema.parse(stored)

			if (!validated || typeof validated !== "object") {
				throw new Error(
					"Invalid object for SerializedError deserialization",
				)
			}

			const causeChain = Array.isArray(validated.causeChain)
				? validated.causeChain.map((cause: any) =>
						SerializedError.serializer.deserialize(cause),
					)
				: []

			return new SerializedError({
				type: validated.type || "unknown",
				name: validated.name || null,
				message: validated.message || "Unknown error",
				callStack: Array.isArray(validated.callStack)
					? validated.callStack
					: [],
				rawStack: validated.rawStack || null,
				causeChain,
			})
		},
	}

	private constructor({
		type,
		name,
		message,
		callStack,
		rawStack,
		causeChain,
	}: {
		type: string
		name: string | null
		message: string
		callStack: StackFrame[]
		rawStack: string | null
		causeChain: SerializedError[]
	}) {
		this.type = type
		this.name = name
		this.message = message
		this.callStack = callStack
		this.rawStack = rawStack
		this.causeChain = causeChain
	}

	/**
	 * Creates a SerializedError from any value.
	 * Extracts as much error information as possible.
	 * @param error - The error value to serialize
	 * @param visited - Set of already visited errors to prevent infinite recursion
	 * @returns A new SerializedError instance
	 */
	public static readonly fromAny = (
		error: any,
		visited = new Set<any>(),
	): SerializedError => {
		const type = typeof error
		let name: string | null = null
		let message: string
		let callStack: StackFrame[] = []
		let rawStack: string | null = null
		let causeChain: SerializedError[] = []

		// Extract message
		if (error instanceof Error) {
			name = error.name
			message = error.message || ""
			rawStack = error.stack || null

			if (rawStack) {
				callStack = Errors.parseStackTrace(rawStack)
			}
		} else if (error && typeof error === "object" && "message" in error) {
			message = String(error.message)
		} else if (error !== null && error !== undefined) {
			message = String(error)
		} else {
			message = error === null ? "null" : "undefined"
		}

		// Extract cause chain if it's a BaseError
		if (error instanceof BaseError) {
			const causes = Errors.extractCauses(error)
			// Filter out causes that are already being processed to avoid infinite recursion
			const filteredCauses = causes.filter(
				(cause: any) => !visited.has(cause),
			)

			// Add current error to visited set before processing causes
			const newVisited = new Set(visited)
			newVisited.add(error)

			causeChain = filteredCauses.map((cause: any) =>
				SerializedError.fromAny(cause, newVisited),
			)
		}

		return new SerializedError({
			type,
			name,
			message,
			callStack,
			rawStack,
			causeChain,
		})
	}

	/**
	 * Returns a string representation of the serialized error.
	 * @returns A formatted string representation
	 */
	public readonly toString = (): string => {
		let result = `SerializedError [${this.type}]`

		if (this.name) {
			result += ` (${this.name})`
		}

		result += `: ${this.message}`

		if (this.causeChain.length > 0) {
			result += `\nCause chain (${this.causeChain.length} errors):`
			this.causeChain.forEach((cause, index) => {
				result += `\n  ${index + 1}. ${cause.toString()}`
			})
		}

		return result
	}

	/**
	 * Returns the formatted stack trace if available.
	 * @returns The formatted stack trace or null if not available
	 */
	public readonly getFormattedStack = (): string | null => {
		if (this.rawStack) {
			return this.rawStack
		}

		if (this.callStack.length === 0) {
			return null
		}

		const header = this.name
			? `${this.name}: ${this.message}`
			: this.message
		const stackLines = this.callStack.map((frame) => {
			if (
				frame.functionName &&
				frame.fileName &&
				frame.lineNumber !== null
			) {
				const location =
					frame.columnNumber !== null
						? `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`
						: `${frame.fileName}:${frame.lineNumber}`
				return `    at ${frame.functionName} (${location})`
			} else if (frame.fileName && frame.lineNumber !== null) {
				const location =
					frame.columnNumber !== null
						? `${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`
						: `${frame.fileName}:${frame.lineNumber}`
				return `    at ${location}`
			} else {
				return `    at ${frame.raw}`
			}
		})

		return [header, ...stackLines].join("\n")
	}

	/**
	 * Compares this SerializedError with another for equality.
	 * Two SerializedErrors are considered equal if all their properties match.
	 * @param other - The other SerializedError to compare with
	 * @returns true if both errors are equal, false otherwise
	 */
	public readonly equals = (other: SerializedError): boolean => {
		if (this === other) {
			return true
		}

		if (
			this.type !== other.type ||
			this.name !== other.name ||
			this.message !== other.message ||
			this.rawStack !== other.rawStack ||
			this.callStack.length !== other.callStack.length ||
			this.causeChain.length !== other.causeChain.length
		) {
			return false
		}

		// Compare call stack frames
		for (let i = 0; i < this.callStack.length; i++) {
			const thisFrame = this.callStack[i]
			const otherFrame = other.callStack[i]

			if (!thisFrame || !otherFrame) {
				return false
			}

			if (
				thisFrame.functionName !== otherFrame.functionName ||
				thisFrame.fileName !== otherFrame.fileName ||
				thisFrame.lineNumber !== otherFrame.lineNumber ||
				thisFrame.columnNumber !== otherFrame.columnNumber ||
				thisFrame.raw !== otherFrame.raw
			) {
				return false
			}
		}

		// Compare cause chain
		for (let i = 0; i < this.causeChain.length; i++) {
			const thisCause = this.causeChain[i]
			const otherCause = other.causeChain[i]

			if (!thisCause || !otherCause || !thisCause.equals(otherCause)) {
				return false
			}
		}

		return true
	}
}

// Register SerializedError comparator in the global registry
globalEqualComparatorRegistry.register(SerializedError as any, {
	equals: (a: SerializedError, b: SerializedError) => a.equals(b),
})
