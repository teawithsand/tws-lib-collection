import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { DB_MIGRATIONS, MintayDrizzleDB } from "./db"

export const getTestingDb = async (migrate = true) => {
	const db = new Database(":memory:")

	const drizzleDb = drizzle(async (sql, params, method) => {
		if (method === "run") {
			if (params.length === 0) {
				db.exec(sql)
			} else {
				const stmt = db.prepare(sql)
				let caught = false
				try {
					stmt.columns()
				} catch (e) {
					caught = true
				}

				if (caught) {
					stmt.run(params)
				} else {
					const rows = stmt.all(params).map(Object.values as any)
					return { rows }
				}
			}
			return { rows: [] }
		} else if (method === "all") {
			const stmt = db.prepare(sql)
			const rows = stmt.all(params).map(Object.values as any)
			return { rows }
		} else if (method === "get") {
			const stmt = db.prepare(sql)
			const row = stmt.get(params)
			return {
				rows: row
					? Object.values(row)
					: (undefined as unknown as string[]),
			}
		} else if (method === "values") {
			const stmt = db.prepare(sql)
			const rows = stmt
				.all(params)
				.map(Object.values as any)
				.map((x) => String(x))
			return { rows }
		} else {
			throw new Error(`Unsupported method: ${method}`)
		}
	})

	if (migrate) {
		await DB_MIGRATIONS.runMigrations(drizzleDb)
	}

	return {
		drizzle: drizzleDb,
		close: async () => {
			db.close()
		},
	}
}

describe("getTestingDb", () => {
	let drizzle: MintayDrizzleDB
	let close: () => any

	beforeEach(async () => {
		const dbInstance = await getTestingDb(false)
		drizzle = dbInstance.drizzle
		close = dbInstance.close
	})

	afterEach(async () => {
		await close()
	})

	test("should return a database instance", async () => {
		expect(drizzle).toBeDefined()
		expect(typeof drizzle.run).toBe("function")
	})

	test("should run migrations and create tables", async () => {
		await DB_MIGRATIONS.runMigrations(drizzle)

		const result = await drizzle.all(
			"SELECT name FROM sqlite_master WHERE type='table'",
		)
		const tables = result.map((row) => (row as any)[0])

		const expectedTables = ["card_collections", "card_events", "cards"]

		for (const table of expectedTables) {
			expect(tables).toContain(table)
		}
	})
})
