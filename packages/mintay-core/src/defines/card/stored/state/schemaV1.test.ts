import { describe, expect, test } from "vitest"
import { StoredSdelkaCardQueueV1 } from "./schemaV1"

describe("StoredSdelkaCardQueueV1 enum", () => {
	test("NEW value should be 0", () => {
		expect(StoredSdelkaCardQueueV1.NEW).toBe(0)
	})

	test("LEARNING value should be 1", () => {
		expect(StoredSdelkaCardQueueV1.LEARNING).toBe(1)
	})

	test("LEARNED value should be 2", () => {
		expect(StoredSdelkaCardQueueV1.LEARNED).toBe(2)
	})

	test("RELEARNING value should be 3", () => {
		expect(StoredSdelkaCardQueueV1.RELEARNING).toBe(3)
	})
})
