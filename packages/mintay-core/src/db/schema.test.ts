import { describe, expect, test } from "vitest"
import { DbSchemaConstants } from "./schema"

describe("DbSchemaConstants", () => {
	test("DEFAULT_PRIORITY should not change unexpectedly", () => {
		expect(DbSchemaConstants.DEFAULT_PRIORITY).toBe(0)
	})

	test("DEFAULT_PRIORITY should not change unexpectedly", () => {
		expect(DbSchemaConstants.DEFAULT_PRIORITY).toEqual(0)
	})
})
