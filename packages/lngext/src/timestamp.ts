import { globalEqualComparatorRegistry } from "./compare/equalComparatorRegistry"
import { BaseError, Errors } from "./error"

export const TimestampError = Errors.makeErrorType("TimestampError", BaseError)

/**
 * Represents a valid Unix timestamp in milliseconds (zero or positive).
 * Ensures the value is a finite, non-negative number.
 */
export class Timestamp {
	private readonly value: number

	/**
	 * Serializer capable of serializing and deserializing this type.
	 *
	 * Unfortunately, reserd types couldn't be used here due to circular dependencies.
	 */
	public static readonly serializer = {
		serialize: (timestamp: Timestamp): number => {
			return timestamp.toNumberMillis()
		},
		deserialize: (value: unknown): Timestamp => {
			if (typeof value !== "number") {
				throw new Error(
					`Timestamp deserialization filed. Expected number, got ${typeof value}`,
				)
			}
			return Timestamp.fromNumber(value)
		},
	}

	/**
	 * Private constructor. Use static methods to create instances.
	 * @param value The timestamp in milliseconds. Must be a finite, zero or positive number.
	 * @throws {TimestampError} If value is not a finite, zero or positive number.
	 */
	private constructor(value: number) {
		if (!Number.isFinite(value) || value < 0) {
			throw new TimestampError(
				"Timestamp value must be a finite, zero or positive number",
			)
		}
		this.value = value
	}

	/**
	 * Creates a Timestamp from a number (milliseconds).
	 * @param value The timestamp in milliseconds.
	 *
	 * @deprecated Use `fromMillis` instead.
	 */
	public static readonly fromNumber = (value: number): Timestamp => {
		return new Timestamp(value)
	}

	/**
	 * Creates a Timestamp from a number (milliseconds).
	 * @param value The timestamp in milliseconds.
	 */
	public static readonly fromMillis = (value: number): Timestamp => {
		return new Timestamp(value)
	}

	/**
	 * Creates a Timestamp from a Date object.
	 * @param date The Date object.
	 */
	public static readonly fromDate = (date: Date): Timestamp => {
		return new Timestamp(date.getTime())
	}

	/**
	 * Gets the timestamp value in milliseconds.
	 */
	public readonly toNumberMillis = (): number => {
		return this.value
	}

	/**
	 * Returns true if the timestamp is exactly zero.
	 */
	public readonly isZero = (): boolean => {
		return this.value === 0
	}

	/**
	 * Returns true if the timestamp is valid (finite and non-negative).
	 */
	public readonly isValid = (): boolean => {
		return Number.isFinite(this.value) && this.value >= 0
	}

	/**
	 * Compares this timestamp to another for equality.
	 * @param other The other Timestamp instance.
	 */
	public readonly equals = (other: Timestamp): boolean => {
		return this.value === other.value
	}
}

// Register Timestamp comparator in the global registry
globalEqualComparatorRegistry.register(Timestamp as any, {
	equals: (a: Timestamp, b: Timestamp) => a.equals(b),
})
