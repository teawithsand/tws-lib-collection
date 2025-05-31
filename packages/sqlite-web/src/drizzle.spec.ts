import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { describe, expect, test } from "vitest"
import { createDrizzleFromPromiser } from "./drizzle"
import { SqliteWorkerClient } from "./workerClient"

// Define a simple test table
const usersTable = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull(),
})

describe("Drizzle Proxy Implementation", () => {
	test("should execute raw SQL queries through proxy", async () => {
		// Create actual SQLite client
		const client = await SqliteWorkerClient.create()

		// Open in-memory database
		await client.open({ filename: ":memory:" })

		// Create table
		await client.exec(`
			CREATE TABLE users (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				email TEXT NOT NULL
			)
		`)

		// Insert test data
		await client.exec(`
			INSERT INTO users (id, name, email) VALUES (69, 'John Doe', 'john@example.com')
		`)

		// Create Drizzle instance
		const db = createDrizzleFromPromiser(client)
		const id = 69

		// Execute raw query using template literal syntax
		const result = await db.run(
			sql`select * from ${usersTable} where ${usersTable.id} = ${id}`,
		)

		expect(result.rows).toBeDefined()
		expect(result.rows).toHaveLength(1)
		expect(result.rows![0]).toEqual([69, "John Doe", "john@example.com"])

		// Clean up
		await client.close()
	})

	test("should select from users table using Drizzle ORM syntax", async () => {
		// Create actual SQLite client
		const client = await SqliteWorkerClient.create()

		// Open in-memory database
		await client.open({ filename: ":memory:" })

		// Create table
		await client.exec(`
			CREATE TABLE users (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				email TEXT NOT NULL
			)
		`)

		// Insert multiple test records
		const testUsers = [
			{ id: 1, name: "Alice Johnson", email: "alice@example.com" },
			{ id: 2, name: "Bob Smith", email: "bob@example.com" },
			{ id: 3, name: "Charlie Brown", email: "charlie@example.com" },
		]

		for (const user of testUsers) {
			await client.exec({
				sql: "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
				bind: [user.id, user.name, user.email],
			})
		}

		// Create Drizzle instance
		const db = createDrizzleFromPromiser(client)

		// Test select all users
		const allUsers = await db.select().from(usersTable)
		expect(allUsers).toHaveLength(3)
		expect(allUsers[0]).toEqual({
			id: 1,
			name: "Alice Johnson",
			email: "alice@example.com",
		})
		expect(allUsers[1]).toEqual({
			id: 2,
			name: "Bob Smith",
			email: "bob@example.com",
		})
		expect(allUsers[2]).toEqual({
			id: 3,
			name: "Charlie Brown",
			email: "charlie@example.com",
		})

		// Test select specific user by id
		const specificUser = await db
			.select()
			.from(usersTable)
			.where(sql`${usersTable.id} = 2`)
		expect(specificUser).toHaveLength(1)
		expect(specificUser[0]).toEqual({
			id: 2,
			name: "Bob Smith",
			email: "bob@example.com",
		})

		// Test select with column selection
		const userNames = await db
			.select({ name: usersTable.name })
			.from(usersTable)
		expect(userNames).toHaveLength(3)
		expect(userNames[0]).toEqual({ name: "Alice Johnson" })
		expect(userNames[1]).toEqual({ name: "Bob Smith" })
		expect(userNames[2]).toEqual({ name: "Charlie Brown" })

		// Clean up
		await client.close()
	})
})
