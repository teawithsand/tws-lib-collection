import { describe, expect, test } from "vitest"
import { SqliteInMemoryClient } from "./inMemoryClient"

describe("SqliteInMemoryClient", () => {
	test("should create client, open database, execute SQL, and close", async () => {
		// Create client
		const client = await SqliteInMemoryClient.create()
		expect(client).toBeDefined()
		expect(client.isOpen()).toBe(false)

		// Open database
		const database = await client.open()
		expect(database).toBeDefined()
		expect(database.filename).toBe(":memory:")
		expect(database.persistent).toBe(false)
		expect(client.isOpen()).toBe(true)
		expect(client.getCurrentDatabase()).toEqual(database)

		// Execute SQL
		await client.exec(
			"CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)",
		)
		await client.exec("INSERT INTO test (name) VALUES ('test1'), ('test2')")

		const result = await client.exec("SELECT * FROM test ORDER BY id")
		expect(result.resultRows).toBeDefined()
		expect(result.resultRows).toHaveLength(2)
		expect(result.resultRows![0]).toEqual({ id: 1, name: "test1" })
		expect(result.resultRows![1]).toEqual({ id: 2, name: "test2" })

		// Close database
		await client.close()
		expect(client.isOpen()).toBe(false)
		expect(client.getCurrentDatabase()).toBeUndefined()
	})

	test("should track change count when countChanges option is enabled", async () => {
		// Create client and open database
		const client = await SqliteInMemoryClient.create()
		await client.open()

		// Create table
		await client.exec(
			"CREATE TABLE change_test (id INTEGER PRIMARY KEY, value TEXT)",
		)

		// Test INSERT with countChanges
		const insertResult = await client.exec({
			sql: "INSERT INTO change_test (value) VALUES (?), (?), (?)",
			bind: ["first", "second", "third"],
			countChanges: true,
		})
		expect(insertResult.changeCount).toBe(3)

		// Test UPDATE with countChanges
		const updateResult = await client.exec({
			sql: "UPDATE change_test SET value = ? WHERE id IN (1, 2)",
			bind: ["updated"],
			countChanges: true,
		})
		expect(updateResult.changeCount).toBe(2)

		// Test DELETE with countChanges
		const deleteResult = await client.exec({
			sql: "DELETE FROM change_test WHERE id = ?",
			bind: [1],
			countChanges: true,
		})
		expect(deleteResult.changeCount).toBe(1)

		// Test without countChanges option (should be undefined)
		const noCountResult = await client.exec(
			"INSERT INTO change_test (value) VALUES ('no-count')",
		)
		expect(noCountResult.changeCount).toBeUndefined()

		await client.close()
	})
})
