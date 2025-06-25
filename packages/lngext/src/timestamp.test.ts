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
})
