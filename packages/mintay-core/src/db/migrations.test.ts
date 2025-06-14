import { createHash } from "node:crypto"
import { describe, expect, test } from "vitest"
import { DB_MIGRATIONS } from "./migrations"

const hashString = (content: string): string => {
	return createHash("md5").update(content).digest("hex")
}

describe("DB_MIGRATIONS", () => {
	test("should have unchanged migration content", () => {
		const migration = DB_MIGRATIONS[0]!

		const expectedUpSqlHash = "519e76b2f0e974d672ce16182a1d9d12"
		const expectedDownSqlHash = "17c078108c17a0c88152214e624f8123"

		expect(migration.version).toBe(1)
		expect(migration.id).toBe("create_initial_schema")
		expect(hashString(migration.upSql)).toBe(expectedUpSqlHash)
		expect(hashString(migration.downSql)).toBe(expectedDownSqlHash)
	})
})
