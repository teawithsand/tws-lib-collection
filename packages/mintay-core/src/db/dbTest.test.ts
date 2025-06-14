import {
	createDrizzleFromClient,
	MigrationManager,
	MigrationTester,
	SqliteInMemoryClient,
} from "@teawithsand/sqlite-web"
import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { MintayDrizzleDB } from "./db"
import { DB_MIGRATIONS } from "./migrations"

export const getTestingDb = async (migrate = true) => {
	const client = await SqliteInMemoryClient.create()
	await client.open()
	const drizzleDb = createDrizzleFromClient(client)

	if (migrate) {
		const migrator = MigrationManager.createWithClient(client, {
			migrations: DB_MIGRATIONS,
		})
		await migrator.migrateToLatest()
	}

	return {
		drizzle: drizzleDb,
		close: async () => {
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
		await MigrationTester.testMigrationsInMemory(DB_MIGRATIONS)
	})
})
