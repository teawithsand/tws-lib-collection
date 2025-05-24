import { describe, expect, test } from "vitest"
import { StoredMintayCardQueueV1 } from "./schemaV1"

describe("StoredMintayCardQueueV1 enum", () => {
	test("NEW value should be 0", () => {
		expect(StoredMintayCardQueueV1.NEW).toBe(0)
	})

	test("LEARNING value should be 1", () => {
		expect(StoredMintayCardQueueV1.LEARNING).toBe(1)
	})

	test("LEARNED value should be 2", () => {
		expect(StoredMintayCardQueueV1.LEARNED).toBe(2)
	})

	test("RELEARNING value should be 3", () => {
		expect(StoredMintayCardQueueV1.RELEARNING).toBe(3)
	})
})
