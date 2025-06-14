import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { SqliteWorkerClient } from "./workerClient"

describe("SqlitePromiser", () => {
	let promiser: SqliteWorkerClient
	beforeEach(async () => {
		// Check for OPFS support
		if (
			!("storage" in navigator) ||
			!("getDirectory" in navigator.storage)
		) {
			throw new Error(
				"OPFS (Origin Private File System) is not supported in this environment",
			)
		}

		// Clean OPFS before each test
		const opfsRoot = await navigator.storage.getDirectory()
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - FileSystemDirectoryHandle.entries() is supported in modern browsers but TypeScript doesn't recognize it
		for await (const [name] of opfsRoot.entries()) {
			await opfsRoot.removeEntry(name, { recursive: true })
		}

		promiser = await SqliteWorkerClient.create()
	})
	afterEach(async () => {
		await promiser.close()
	})

	test("should open database successfully", async () => {
		await promiser.open({ filename: "file:mydb.sqlite3?vfs=opfs" })

		// Exec some SQL in that DB.
		await promiser.exec({
			sql: `CREATE TABLE x(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)`,
		})
	})

	test("should get SQLite configuration", async () => {
		const config = await promiser.getConfig()

		expect(config).toBeDefined()
		expect(config.version).toBeDefined()
		expect(typeof config.bigIntEnabled).toBe("boolean")
		expect(Array.isArray(config.vfsList)).toBe(true)
		expect(config.vfsList.length).toBeGreaterThan(0)
	})

	test("should switch between databases correctly", async () => {
		// Open first database and create table with specific data
		const db1 = await promiser.open({
			filename: "file:db1.sqlite3?vfs=opfs",
		})
		expect(db1.filename).toBe("file:db1.sqlite3?vfs=opfs")

		await promiser.exec({
			sql: `CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)`,
		})
		await promiser.exec({
			sql: `INSERT INTO test_table (name) VALUES ('database_one')`,
		})

		// Verify data in first database
		const result1 = await promiser.exec({
			sql: `SELECT name FROM test_table WHERE id = 1`,
			returnValue: "resultRows",
		})
		expect(result1.resultRows).toHaveLength(1)
		expect(result1.resultRows?.[0]).toEqual(["database_one"])

		await promiser.close()

		// Open second database and create table with different data
		const db2 = await promiser.open({
			filename: "file:db2.sqlite3?vfs=opfs",
		})
		expect(db2.filename).toBe("file:db2.sqlite3?vfs=opfs")

		await promiser.exec({
			sql: `CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)`,
		})
		await promiser.exec({
			sql: `INSERT INTO test_table (name) VALUES ('database_two')`,
		})

		// Verify data in second database is different
		const result2 = await promiser.exec({
			sql: `SELECT name FROM test_table WHERE id = 1`,
			returnValue: "resultRows",
		})
		expect(result2.resultRows).toHaveLength(1)
		expect(result2.resultRows?.[0]).toEqual(["database_two"])

		// Verify we're working with the correct database
		expect(promiser.getCurrentDatabase()?.filename).toBe(
			"file:db2.sqlite3?vfs=opfs",
		)
	})

	test("should close database successfully", async () => {
		// Open a database first
		await promiser.open({ filename: "file:testdb.sqlite3?vfs=opfs" })

		// Verify database is open
		expect(promiser.isOpen()).toBe(true)
		expect(promiser.getCurrentDatabase()).toBeDefined()

		// Close the database
		const closeResult = await promiser.close()

		// Verify database is closed
		expect(promiser.isOpen()).toBe(false)
		expect(promiser.getCurrentDatabase()).toBeUndefined()
		expect(closeResult).toBeDefined()
	})

	test("should work with :memory: database without creating OPFS files", async () => {
		// Get initial OPFS contents
		const opfsRoot = await navigator.storage.getDirectory()
		const initialEntries: string[] = []
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - FileSystemDirectoryHandle.entries() is supported in modern browsers but TypeScript doesn't recognize it
		for await (const [name] of opfsRoot.entries()) {
			initialEntries.push(name)
		}

		// Open memory database
		const db = await promiser.open({ filename: ":memory:" })
		expect(db.filename).toBe(":memory:")

		// Create table and insert data
		await promiser.exec({
			sql: `CREATE TABLE memory_test (id INTEGER PRIMARY KEY, value TEXT)`,
		})
		await promiser.exec({
			sql: `INSERT INTO memory_test (value) VALUES ('test_data')`,
		})

		// Verify data exists
		const result = await promiser.exec({
			sql: `SELECT value FROM memory_test WHERE id = 1`,
			returnValue: "resultRows",
		})
		expect(result.resultRows).toHaveLength(1)
		expect(result.resultRows?.[0]).toEqual(["test_data"])

		// Verify no new OPFS files were created
		const finalEntries: string[] = []
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - FileSystemDirectoryHandle.entries() is supported in modern browsers but TypeScript doesn't recognize it
		for await (const [name] of opfsRoot.entries()) {
			finalEntries.push(name)
		}

		expect(finalEntries).toEqual(initialEntries)

		// Close and verify memory database is no longer accessible
		await promiser.close()
		expect(promiser.getCurrentDatabase()).toBeUndefined()
	})
})
