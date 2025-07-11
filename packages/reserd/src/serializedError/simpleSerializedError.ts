import {
	BaseError,
	Errors,
	globalEqualComparatorRegistry,
} from "@teawithsand/lngext"
import { z } from "zod"
import { SerializerUnknown } from "../serialization"
import { SerializedError } from "./serializedError"

/**
 * Zod schema for validating SimpleSerializedError plain objects
 */
const simpleSerializedErrorStoredSchema: z.ZodType<SimpleSerializedErrorStored> =
	z.lazy(() =>
		z.object({
			type: z.string(),
			name: z.string().nullable(),
			message: z.string(),
			causeChain: z.array(simpleSerializedErrorStoredSchema),
		}),
	)

/**
 * Stored representation of SimpleSerializedError for serialization
 */
type SimpleSerializedErrorStored = {
	type: string
	name: string | null
	message: string
	causeChain: SimpleSerializedErrorStored[]
}

/**
 * Represents a simplified serialized error that captures basic error information
 * without stack traces or call stack information.
 * Used for lightweight error storage and transmission when stack traces are not needed.
 */
export class SimpleSerializedError {
	/** The type of the error (result of typeof operator) */
	public readonly type: string

	/** The name of the error (if it's an instance of Error) */
	public readonly name: string | null

	/** The error message */
	public readonly message: string

	/** Serialized cause chain (if error is instance of BaseError) */
	public readonly causeChain: SimpleSerializedError[]

	/**
	 * Zod schema for validating SimpleSerializedError plain objects
	 */
	public static readonly schema = simpleSerializedErrorStoredSchema

	/**
	 * Static serializer for converting between SimpleSerializedError and plain objects
	 */
	public static readonly serializer: SerializerUnknown<
		SimpleSerializedError,
		SimpleSerializedErrorStored
	> = {
		serialize: (
			owned: SimpleSerializedError,
		): SimpleSerializedErrorStored => {
			return {
				type: owned.type,
				name: owned.name,
				message: owned.message,
				causeChain: owned.causeChain.map((cause) =>
					SimpleSerializedError.serializer.serialize(cause),
				),
			}
		},
		deserialize: (stored: unknown): SimpleSerializedError => {
			const validated = SimpleSerializedError.schema.parse(stored)

			if (!validated || typeof validated !== "object") {
				throw new Error(
					"Invalid object for SimpleSerializedError deserialization",
				)
			}

			const causeChain = Array.isArray(validated.causeChain)
				? validated.causeChain.map((cause: any) =>
						SimpleSerializedError.serializer.deserialize(cause),
					)
				: []

			return new SimpleSerializedError({
				type: validated.type || "unknown",
				name: validated.name || null,
				message: validated.message || "Unknown error",
				causeChain,
			})
		},
	}

	private constructor({
		type,
		name,
		message,
		causeChain,
	}: {
		type: string
		name: string | null
		message: string
		causeChain: SimpleSerializedError[]
	}) {
		this.type = type
		this.name = name
		this.message = message
		this.causeChain = causeChain
	}

	/**
	 * Creates a SimpleSerializedError from any value.
	 * Extracts basic error information without stack traces.
	 * @param error - The error value to serialize
	 * @param visited - Set of already visited errors to prevent infinite recursion
	 * @returns A new SimpleSerializedError instance
	 */
	public static readonly fromAny = (
		error: any,
		visited = new Set<any>(),
	): SimpleSerializedError => {
		const type = typeof error
		let name: string | null = null
		let message: string
		let causeChain: SimpleSerializedError[] = []

		// Extract message
		if (error instanceof Error) {
			name = error.name
			message = error.message || ""
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
				SimpleSerializedError.fromAny(cause, newVisited),
			)
		}

		return new SimpleSerializedError({
			type,
			name,
			message,
			causeChain,
		})
	}

	/**
	 * Creates a SimpleSerializedError from a SerializedError.
	 * @param serializedError - The SerializedError to convert
	 * @returns A new SimpleSerializedError instance
	 */
	private static readonly fromSerializedError = (
		serializedError: SerializedError,
	): SimpleSerializedError => {
		return new SimpleSerializedError({
			type: serializedError.type,
			name: serializedError.name,
			message: serializedError.message,
			causeChain: serializedError.causeChain.map((cause) =>
				SimpleSerializedError.fromSerializedError(cause),
			),
		})
	}

	/**
	 * Returns a string representation of the simple serialized error.
	 * @returns A formatted string representation
	 */
	public readonly toString = (): string => {
		let result = `SimpleSerializedError [${this.type}]`

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
	 * Compares this SimpleSerializedError with another for equality.
	 * Two SimpleSerializedErrors are considered equal if all their properties match.
	 * @param other - The other SimpleSerializedError to compare with
	 * @returns true if both errors are equal, false otherwise
	 */
	public readonly equals = (other: SimpleSerializedError): boolean => {
		if (this === other) {
			return true
		}

		if (
			this.type !== other.type ||
			this.name !== other.name ||
			this.message !== other.message ||
			this.causeChain.length !== other.causeChain.length
		) {
			return false
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

globalEqualComparatorRegistry.register(SimpleSerializedError as any, {
	equals: (a: SimpleSerializedError, b: SimpleSerializedError) => a.equals(b),
})
