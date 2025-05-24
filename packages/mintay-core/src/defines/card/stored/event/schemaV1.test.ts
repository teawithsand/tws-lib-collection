import { describe, expect, test } from "vitest"
import { StoredMintayAnswerV1, StoredMintayCardEventTypeV1 } from "./schemaV1"

describe("StoredMintayCardEventTypeV1 enum", () => {
	test("ANSWER value should be 0", () => {
		expect(StoredMintayCardEventTypeV1.ANSWER).toBe(0)
	})
})

describe("StoredMintayAnswerV1 enum", () => {
	test("AGAIN value should be 1", () => {
		expect(StoredMintayAnswerV1.AGAIN).toBe(1)
	})

	test("HARD value should be 2", () => {
		expect(StoredMintayAnswerV1.HARD).toBe(2)
	})

	test("GOOD value should be 3", () => {
		expect(StoredMintayAnswerV1.GOOD).toBe(3)
	})

	test("EASY value should be 4", () => {
		expect(StoredMintayAnswerV1.EASY).toBe(4)
	})
})
