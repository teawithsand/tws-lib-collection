import {
	createDrizzleFromClient,
	SqliteInMemoryClient,
} from "@teawithsand/sqlite-web"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { DB_MIGRATIONS, MintayDrizzleDB } from "./db"

export const getTestingDb = async (migrate = true) => {
	const client = await SqliteInMemoryClient.create()
	await client.open()
	const drizzleDb = createDrizzleFromClient(client)

	if (migrate) {
		await DB_MIGRATIONS.runMigrations(drizzleDb)
	}

	return {
		drizzle: drizzleDb,
		close: async () => {
			console.log(client.close)
			await client.close()
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
