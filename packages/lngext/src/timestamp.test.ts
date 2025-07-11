import { describe, expect, test } from "vitest"
import { Timestamp, TimestampError } from "./timestamp"

describe("Timestamp", () => {
	// Creation: valid cases
	test("fromNumber creates instance for zero", () => {
		const ts = Timestamp.fromNumber(0)
		expect(ts.isZero()).toBe(true)
		expect(ts.toNumberMillis()).toBe(0)
	})

	test("fromNumber creates instance for positive value", () => {
		const ts = Timestamp.fromNumber(123456789)
		expect(ts.isZero()).toBe(false)
		expect(ts.toNumberMillis()).toBe(123456789)
	})

	test("fromDate creates instance from Date", () => {
		const date = new Date(987654321)
		const ts = Timestamp.fromDate(date)
		expect(ts.toNumberMillis()).toBe(date.getTime())
	})

	// Creation: invalid cases
	test("fromNumber throws for negative value", () => {
		expect(() => Timestamp.fromNumber(-1)).toThrow(TimestampError)
	})

	test("fromNumber throws for NaN", () => {
		expect(() => Timestamp.fromNumber(Number.NaN)).toThrow(TimestampError)
	})

	test("fromNumber throws for Infinity", () => {
		expect(() => Timestamp.fromNumber(Number.POSITIVE_INFINITY)).toThrow(
			TimestampError,
		)
	})

	// isZero
	test("isZero returns true only for zero", () => {
		const zero = Timestamp.fromNumber(0)
		const nonZero = Timestamp.fromNumber(1)
		expect(zero.isZero()).toBe(true)
		expect(nonZero.isZero()).toBe(false)
	})

	// equals
	test("equals returns true for same value", () => {
		const a = Timestamp.fromNumber(1000)
		const b = Timestamp.fromNumber(1000)
		expect(a.equals(b)).toBe(true)
	})

	test("equals returns false for different values", () => {
		const a = Timestamp.fromNumber(1000)
		const b = Timestamp.fromNumber(2000)
		expect(a.equals(b)).toBe(false)
	})

	// toNumberMillis
	test("toNumberMillis returns the correct value", () => {
		const value = 5555
		const ts = Timestamp.fromNumber(value)
		expect(ts.toNumberMillis()).toBe(value)
	})

	// Serializer tests
	describe("serialize", () => {
		test("serialize returns correct number for various timestamps", () => {
			const testCases = [
				{ value: 0, description: "zero" },
				{ value: 1234567890, description: "positive number" },
				{ value: Number.MAX_SAFE_INTEGER, description: "large number" },
			]

			testCases.forEach(({ value, description }) => {
				const ts = Timestamp.fromNumber(value)
				const result = Timestamp.serializer.serialize(ts)
				expect(result).toBe(value)
			})

			// Test with Date
			const date = new Date(987654321)
			const ts = Timestamp.fromDate(date)
			const result = Timestamp.serializer.serialize(ts)
			expect(result).toBe(date.getTime())
		})
	})

	describe("deserialize", () => {
		test("deserialize creates correct timestamp from zero", () => {
			const result = Timestamp.serializer.deserialize(0)
			expect(result.toNumberMillis()).toBe(0)
			expect(result.isZero()).toBe(true)
		})

		test("deserialize creates correct timestamp from positive number", () => {
			const value = 1234567890
			const result = Timestamp.serializer.deserialize(value)
			expect(result.toNumberMillis()).toBe(value)
			expect(result.isZero()).toBe(false)
		})

		test("deserialize creates correct timestamp from large number", () => {
			const value = Number.MAX_SAFE_INTEGER
			const result = Timestamp.serializer.deserialize(value)
			expect(result.toNumberMillis()).toBe(value)
		})

		test("deserialize throws for string input", () => {
			expect(() => Timestamp.serializer.deserialize("123")).toThrow(Error)
			expect(() => Timestamp.serializer.deserialize("123")).toThrow(
				"Timestamp deserialization filed. Expected number, got string",
			)
		})

		test("deserialize throws for null input", () => {
			expect(() => Timestamp.serializer.deserialize(null)).toThrow(Error)
			expect(() => Timestamp.serializer.deserialize(null)).toThrow(
				"Timestamp deserialization filed. Expected number, got object",
			)
		})

		test("deserialize throws for undefined input", () => {
			expect(() => Timestamp.serializer.deserialize(undefined)).toThrow(
				Error,
			)
			expect(() => Timestamp.serializer.deserialize(undefined)).toThrow(
				"Timestamp deserialization filed. Expected number, got undefined",
			)
		})

		test("deserialize throws for boolean input", () => {
			expect(() => Timestamp.serializer.deserialize(true)).toThrow(Error)
			expect(() => Timestamp.serializer.deserialize(true)).toThrow(
				"Timestamp deserialization filed. Expected number, got boolean",
			)
		})

		test("deserialize throws for object input", () => {
			expect(() => Timestamp.serializer.deserialize({})).toThrow(Error)
			expect(() => Timestamp.serializer.deserialize({})).toThrow(
				"Timestamp deserialization filed. Expected number, got object",
			)
		})

		test("deserialize throws for array input", () => {
			expect(() => Timestamp.serializer.deserialize([123])).toThrow(Error)
			expect(() => Timestamp.serializer.deserialize([123])).toThrow(
				"Timestamp deserialization filed. Expected number, got object",
			)
		})

		test("deserialize throws for negative number (via fromNumber validation)", () => {
			expect(() => Timestamp.serializer.deserialize(-1)).toThrow(
				TimestampError,
			)
		})

		test("deserialize throws for NaN (via fromNumber validation)", () => {
			expect(() => Timestamp.serializer.deserialize(Number.NaN)).toThrow(
				TimestampError,
			)
		})

		test("deserialize throws for Infinity (via fromNumber validation)", () => {
			expect(() =>
				Timestamp.serializer.deserialize(Number.POSITIVE_INFINITY),
			).toThrow(TimestampError)
		})
	})

	describe("serialize roundtrip", () => {
		test("serialize and deserialize maintain value consistency", () => {
			const originalValue = 1640995200000 // 2022-01-01 00:00:00 UTC
			const timestamp = Timestamp.fromNumber(originalValue)
			const serialized = Timestamp.serializer.serialize(timestamp)
			const deserialized = Timestamp.serializer.deserialize(serialized)

			expect(deserialized.toNumberMillis()).toBe(originalValue)
			expect(deserialized.equals(timestamp)).toBe(true)
		})

		test("serialize and deserialize work with zero", () => {
			const timestamp = Timestamp.fromNumber(0)
			const serialized = Timestamp.serializer.serialize(timestamp)
			const deserialized = Timestamp.serializer.deserialize(serialized)

			expect(deserialized.isZero()).toBe(true)
			expect(deserialized.equals(timestamp)).toBe(true)
		})

		test("serialize and deserialize work with large values", () => {
			const originalValue = Number.MAX_SAFE_INTEGER
			const timestamp = Timestamp.fromNumber(originalValue)
			const serialized = Timestamp.serializer.serialize(timestamp)
			const deserialized = Timestamp.serializer.deserialize(serialized)

			expect(deserialized.toNumberMillis()).toBe(originalValue)
			expect(deserialized.equals(timestamp)).toBe(true)
		})
	})
})
