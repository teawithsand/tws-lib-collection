import { describe, expect, test } from "vitest"
import { StoredSdelkaAnswerV1, StoredSdelkaCardEventTypeV1 } from "./schemaV1"

describe("StoredSdelkaCardEventTypeV1 enum", () => {
	test("ANSWER value should be 0", () => {
		expect(StoredSdelkaCardEventTypeV1.ANSWER).toBe(0)
	})
})

describe("StoredSdelkaAnswerV1 enum", () => {
	test("AGAIN value should be 1", () => {
		expect(StoredSdelkaAnswerV1.AGAIN).toBe(1)
	})

	test("HARD value should be 2", () => {
		expect(StoredSdelkaAnswerV1.HARD).toBe(2)
	})

	test("GOOD value should be 3", () => {
		expect(StoredSdelkaAnswerV1.GOOD).toBe(3)
	})

	test("EASY value should be 4", () => {
		expect(StoredSdelkaAnswerV1.EASY).toBe(4)
	})
})
