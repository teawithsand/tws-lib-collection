import { describe, expect, test } from "vitest"
import { AbookEntrySourceTypeStoredV1 } from "./common"

describe("AbookEntry stored common types", () => {
	describe("enum stability", () => {
		test("AbookEntrySourceTypeStoredV1 values should not change", () => {
			// These values are used in serialized data and must never change
			expect(AbookEntrySourceTypeStoredV1.UPLOAD).toBe("upload")
			expect(AbookEntrySourceTypeStoredV1.URL).toBe("url")
		})

		test("AbookEntrySourceTypeStoredV1 should have exactly the expected keys", () => {
			const keys = Object.keys(AbookEntrySourceTypeStoredV1).sort()
			expect(keys).toEqual(["UPLOAD", "URL"])
		})
	})
})
