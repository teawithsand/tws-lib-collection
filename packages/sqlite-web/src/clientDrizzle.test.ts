import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { describe, expect, test } from "vitest"
import { createDrizzleFromClient } from "./drizzle"
import { SqliteInMemoryClient } from "./inMemoryClient"

// Define a simple test table
const usersTable = sqliteTable("users", {
	id: integer("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull(),
})

// Define a table with nullable columns for null testing
const profilesTable = sqliteTable("profiles", {
	id: integer("id").primaryKey(),
	userId: integer("user_id").notNull(),
	bio: text("bio"), // nullable
	website: text("website"), // nullable
	avatar: text("avatar"), // nullable
})

// Define a table with JSON text fields
const documentsTable = sqliteTable("documents", {
	id: integer("id").primaryKey(),
	title: text("title").notNull(),
	metadata: text("metadata", { mode: "json" }).notNull(),
	tags: text("tags", { mode: "json" }),
	content: text("content", { mode: "json" }).notNull(),
})

describe("InMemoryClient Drizzle Integration", () => {
	test("should execute raw SQL queries through proxy with InMemoryClient", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

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
		const db = createDrizzleFromClient(client)
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

	test("should select from users table using Drizzle ORM syntax with InMemoryClient", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

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
		const db = createDrizzleFromClient(client)

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

	test("should handle insert operations with Drizzle ORM syntax", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

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

		// Create Drizzle instance
		const db = createDrizzleFromClient(client)

		// Insert using Drizzle insert syntax
		await db.insert(usersTable).values({
			id: 1,
			name: "Test User",
			email: "test@example.com",
		})

		// Verify the insert worked
		const users = await db.select().from(usersTable)
		expect(users).toHaveLength(1)
		expect(users[0]).toEqual({
			id: 1,
			name: "Test User",
			email: "test@example.com",
		})

		// Clean up
		await client.close()
	})

	test("should handle get operation to retrieve single record with Drizzle ORM syntax", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

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
		await client.exec({
			sql: "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
			bind: [1, "Alice Johnson", "alice@example.com"],
		})

		await client.exec({
			sql: "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
			bind: [2, "Bob Smith", "bob@example.com"],
		})

		// Create Drizzle instance
		const db = createDrizzleFromClient(client)

		// Test get method - should return single record as object
		const user = await db
			.select()
			.from(usersTable)
			.where(sql`${usersTable.id} = 1`)
			.get()

		// Verify get returns a single object (not an array)
		expect(user).toBeDefined()
		expect(user).toEqual({
			id: 1,
			name: "Alice Johnson",
			email: "alice@example.com",
		})

		// Test get with no results - should return undefined
		const nonExistentUser = await db
			.select()
			.from(usersTable)
			.where(sql`${usersTable.id} = 999`)
			.get()

		expect(nonExistentUser).toBeUndefined()

		// Clean up
		await client.close()
	})

	test("should handle null values in nullable columns", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

		// Open in-memory database
		await client.open({ filename: ":memory:" })

		// Create profiles table with nullable columns
		await client.exec(`
			CREATE TABLE profiles (
				id INTEGER PRIMARY KEY,
				user_id INTEGER NOT NULL,
				bio TEXT,
				website TEXT,
				avatar TEXT
			)
		`)

		// Create Drizzle instance
		const db = createDrizzleFromClient(client)

		// Insert profile with all null values
		await db.insert(profilesTable).values({
			id: 1,
			userId: 100,
			bio: null,
			website: null,
			avatar: null,
		})

		// Insert profile with mixed null and non-null values
		await db.insert(profilesTable).values({
			id: 2,
			userId: 200,
			bio: "I love coding",
			website: null,
			avatar: "avatar.jpg",
		})

		// Insert profile with no null values
		await db.insert(profilesTable).values({
			id: 3,
			userId: 300,
			bio: "Full-stack developer",
			website: "https://example.com",
			avatar: "profile.png",
		})

		// Test select all profiles to verify null handling
		const allProfiles = await db.select().from(profilesTable)
		expect(allProfiles).toHaveLength(3)

		// Verify profile with all nulls
		expect(allProfiles[0]).toEqual({
			id: 1,
			userId: 100,
			bio: null,
			website: null,
			avatar: null,
		})

		// Explicitly verify null values are strictly null (not undefined, empty string, or 0)
		expect(allProfiles[0]?.bio).toBeNull()
		expect(allProfiles[0]?.website).toBeNull()
		expect(allProfiles[0]?.avatar).toBeNull()
		expect(allProfiles[0]?.bio).not.toBeUndefined()
		expect(allProfiles[0]?.bio).not.toBe("")
		expect(allProfiles[0]?.bio).not.toBe(0)

		// Verify profile with mixed nulls
		expect(allProfiles[1]).toEqual({
			id: 2,
			userId: 200,
			bio: "I love coding",
			website: null,
			avatar: "avatar.jpg",
		})

		// Explicitly verify mixed null and non-null values
		expect(allProfiles[1]?.bio).toBe("I love coding")
		expect(allProfiles[1]?.website).toBeNull()
		expect(allProfiles[1]?.website).not.toBeUndefined()
		expect(allProfiles[1]?.avatar).toBe("avatar.jpg")

		// Verify profile with no nulls
		expect(allProfiles[2]).toEqual({
			id: 3,
			userId: 300,
			bio: "Full-stack developer",
			website: "https://example.com",
			avatar: "profile.png",
		})

		// Test get method with null values
		const profileWithNulls = await db
			.select()
			.from(profilesTable)
			.where(sql`${profilesTable.id} = 1`)
			.get()

		expect(profileWithNulls).toBeDefined()
		expect(profileWithNulls).toEqual({
			id: 1,
			userId: 100,
			bio: null,
			website: null,
			avatar: null,
		})

		// Additional explicit null assertions for get method
		expect(profileWithNulls!.bio).toBeNull()
		expect(profileWithNulls!.website).toBeNull()
		expect(profileWithNulls!.avatar).toBeNull()
		expect(profileWithNulls!.bio).not.toBeUndefined()
		expect(profileWithNulls!.website).not.toBe("")
		expect(profileWithNulls!.avatar).not.toBe(0)
		expect(profileWithNulls!.bio).toBe(null)
		expect(profileWithNulls!.website).toBe(null)
		expect(profileWithNulls!.avatar).toBe(null)

		// Test filtering by null values
		const profilesWithNullBio = await db
			.select()
			.from(profilesTable)
			.where(sql`${profilesTable.bio} IS NULL`)

		expect(profilesWithNullBio).toHaveLength(1)
		expect(profilesWithNullBio.map((p) => p.id)).toEqual([1])

		// Test filtering by non-null values
		const profilesWithBio = await db
			.select()
			.from(profilesTable)
			.where(sql`${profilesTable.bio} IS NOT NULL`)

		expect(profilesWithBio).toHaveLength(2)
		expect(profilesWithBio.map((p) => p.id)).toEqual([2, 3])

		// Clean up
		await client.close()
	})

	test("should handle JSON data in text fields", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

		// Open in-memory database
		await client.open({ filename: ":memory:" })

		// Create documents table with JSON text fields
		await client.exec(`
			CREATE TABLE documents (
				id INTEGER PRIMARY KEY,
				title TEXT NOT NULL,
				metadata TEXT NOT NULL,
				tags TEXT,
				content TEXT NOT NULL
			)
		`)

		// Create Drizzle instance
		const db = createDrizzleFromClient(client)

		// Complex objects to test JSON serialization
		const metadata = {
			author: "John Doe",
			createdAt: "2024-01-15T10:30:00Z",
			version: 1.2,
			published: true,
			categories: ["tech", "javascript"],
			settings: {
				theme: "dark",
				fontSize: 14,
				notifications: {
					email: true,
					push: false,
				},
			},
		}

		const tags = ["tutorial", "advanced", "web-development"]

		const content = {
			sections: [
				{
					title: "Introduction",
					paragraphs: [
						"Welcome to this tutorial",
						"Let's get started",
					],
					codeBlocks: [
						{
							language: "typescript",
							code: "const x: number = 42;",
						},
					],
				},
				{
					title: "Advanced Topics",
					paragraphs: ["Now for the complex stuff"],
					codeBlocks: [],
				},
			],
			footnotes: [
				{ id: 1, text: "Reference to documentation" },
				{ id: 2, text: "See also: related article" },
			],
		}

		// Insert document with JSON data
		await db.insert(documentsTable).values({
			id: 1,
			title: "TypeScript Tutorial",
			metadata,
			tags,
			content,
		})

		// Insert document with null tags (testing nullable JSON field)
		await db.insert(documentsTable).values({
			id: 2,
			title: "Simple Guide",
			metadata: { author: "Jane Smith", version: 1.0 },
			tags: null,
			content: { text: "Simple content" },
		})

		// Test select all documents
		const allDocuments = await db.select().from(documentsTable)
		expect(allDocuments).toHaveLength(2)

		// Verify first document with complex JSON
		const firstDoc = allDocuments[0]!
		expect(firstDoc.id).toBe(1)
		expect(firstDoc.title).toBe("TypeScript Tutorial")
		expect(firstDoc.metadata).toEqual(metadata)
		expect(firstDoc.tags).toEqual(tags)
		expect(firstDoc.content).toEqual(content)

		// Verify nested object structure is preserved
		expect((firstDoc.metadata as any).settings.notifications.email).toBe(
			true,
		)
		expect((firstDoc.metadata as any).settings.notifications.push).toBe(
			false,
		)
		expect(
			(firstDoc.content as any).sections[0].codeBlocks[0].language,
		).toBe("typescript")
		expect((firstDoc.content as any).footnotes).toHaveLength(2)

		// Verify second document with null tags
		const secondDoc = allDocuments[1]!
		expect(secondDoc.id).toBe(2)
		expect(secondDoc.title).toBe("Simple Guide")
		expect(secondDoc.metadata).toEqual({
			author: "Jane Smith",
			version: 1.0,
		})
		expect(secondDoc.tags).toBeNull()
		expect(secondDoc.content).toEqual({ text: "Simple content" })

		// Test get method with JSON data
		const specificDoc = await db
			.select()
			.from(documentsTable)
			.where(sql`${documentsTable.id} = 1`)
			.get()

		expect(specificDoc).toBeDefined()
		expect(specificDoc!.metadata).toEqual(metadata)
		expect(specificDoc!.tags).toEqual(tags)
		expect(specificDoc!.content).toEqual(content)

		// Test filtering by JSON field values (using raw SQL for JSON operations)
		const techDocs = await db
			.select()
			.from(documentsTable)
			.where(
				sql`json_extract(${documentsTable.metadata}, '$.author') = 'John Doe'`,
			)

		expect(techDocs).toHaveLength(1)
		expect(techDocs[0]!.id).toBe(1)

		// Test array handling in JSON fields
		expect(Array.isArray(firstDoc.tags)).toBe(true)
		expect(firstDoc.tags).toContain("tutorial")
		expect(firstDoc.tags).toContain("advanced")
		expect(firstDoc.tags).toContain("web-development")

		// Test updating JSON fields
		const updatedMetadata = {
			...metadata,
			version: 2.0,
			lastModified: "2024-01-16T14:20:00Z",
		}

		await db
			.update(documentsTable)
			.set({ metadata: updatedMetadata })
			.where(sql`${documentsTable.id} = 1`)

		// Verify update worked
		const updatedDoc = await db
			.select()
			.from(documentsTable)
			.where(sql`${documentsTable.id} = 1`)
			.get()

		expect((updatedDoc!.metadata as any).version).toBe(2.0)
		expect((updatedDoc!.metadata as any).lastModified).toBe(
			"2024-01-16T14:20:00Z",
		)
		expect((updatedDoc!.metadata as any).author).toBe("John Doe") // Original value preserved

		// Clean up
		await client.close()
	})

	test("should ensure two in-memory instances are completely disjoint", async () => {
		// Create first SQLite client
		const client1 = await SqliteInMemoryClient.create()
		await client1.open({ filename: ":memory:" })

		// Create second SQLite client
		const client2 = await SqliteInMemoryClient.create()
		await client2.open({ filename: ":memory:" })

		// Create identical table structure in both databases
		const createTableSQL = `
			CREATE TABLE users (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL,
				email TEXT NOT NULL
			)
		`

		await client1.exec(createTableSQL)
		await client2.exec(createTableSQL)

		// Create Drizzle instances for both clients
		const db1 = createDrizzleFromClient(client1)
		const db2 = createDrizzleFromClient(client2)

		// Insert different data into each database
		await db1.insert(usersTable).values({
			id: 1,
			name: "Alice from DB1",
			email: "alice@db1.com",
		})

		await db2.insert(usersTable).values({
			id: 1,
			name: "Bob from DB2",
			email: "bob@db2.com",
		})

		// Verify that each database only contains its own data
		const users1 = await db1.select().from(usersTable)
		const users2 = await db2.select().from(usersTable)

		expect(users1).toHaveLength(1)
		expect(users2).toHaveLength(1)

		// Verify the data is different and isolated
		expect(users1[0]).toEqual({
			id: 1,
			name: "Alice from DB1",
			email: "alice@db1.com",
		})

		expect(users2[0]).toEqual({
			id: 1,
			name: "Bob from DB2",
			email: "bob@db2.com",
		})

		// Add more data to first database and verify isolation
		await db1.insert(usersTable).values({
			id: 2,
			name: "Charlie from DB1",
			email: "charlie@db1.com",
		})

		// Check that second database still only has one record
		const users1Updated = await db1.select().from(usersTable)
		const users2Unchanged = await db2.select().from(usersTable)

		expect(users1Updated).toHaveLength(2)
		expect(users2Unchanged).toHaveLength(1)

		// Verify second database data is still unchanged
		expect(users2Unchanged[0]).toEqual({
			id: 1,
			name: "Bob from DB2",
			email: "bob@db2.com",
		})

		// Test schema isolation - add column to first database only
		await client1.exec("ALTER TABLE users ADD COLUMN age INTEGER")

		// Insert data with age in first database
		await client1.exec({
			sql: "INSERT INTO users (id, name, email, age) VALUES (?, ?, ?, ?)",
			bind: [3, "David from DB1", "david@db1.com", 30],
		})

		// Verify second database schema is unaffected (should not have age column)
		// This should work without error since second database doesn't have age column
		await db2.insert(usersTable).values({
			id: 2,
			name: "Eve from DB2",
			email: "eve@db2.com",
		})

		const finalUsers1 = await db1.select().from(usersTable)
		const finalUsers2 = await db2.select().from(usersTable)

		expect(finalUsers1).toHaveLength(3)
		expect(finalUsers2).toHaveLength(2)

		// Clean up both clients
		await client1.close()
		await client2.close()
	})

	test("should handle last_insert_rowid() function correctly", async () => {
		// Create actual SQLite client
		const client = await SqliteInMemoryClient.create()

		// Open in-memory database
		await client.open({ filename: ":memory:" })

		// Create table without explicit primary key to test ROWID behavior
		await client.exec(`
			CREATE TABLE test_rowid (
				name TEXT NOT NULL,
				value INTEGER
			)
		`)

		// Create Drizzle instance
		const db = createDrizzleFromClient(client)

		// Insert first record and check last_insert_rowid
		await client.exec({
			sql: "INSERT INTO test_rowid (name, value) VALUES (?, ?)",
			bind: ["first", 100],
		})

		const firstRowId = await db.run(
			sql`SELECT last_insert_rowid() as rowid`,
		)
		expect(firstRowId.rows).toBeDefined()
		expect(firstRowId.rows).toHaveLength(1)
		expect(firstRowId.rows![0]).toEqual([1])

		// Insert second record and verify rowid incremented
		await client.exec({
			sql: "INSERT INTO test_rowid (name, value) VALUES (?, ?)",
			bind: ["second", 200],
		})

		const secondRowId = await db.run(
			sql`SELECT last_insert_rowid() as rowid`,
		)
		expect(secondRowId.rows![0]).toEqual([2])

		// Insert third record using Drizzle insert and check rowid
		const testRowidTable = sqliteTable("test_rowid", {
			name: text("name").notNull(),
			value: integer("value"),
		})

		await db.insert(testRowidTable).values({
			name: "third",
			value: 300,
		})

		const thirdRowId = await db.run(
			sql`SELECT last_insert_rowid() as rowid`,
		)
		expect(thirdRowId.rows![0]).toEqual([3])

		// Verify that rowid persists across different operations
		// Perform a SELECT operation (should not affect last_insert_rowid)
		await db.select().from(testRowidTable)

		const unchangedRowId = await db.run(
			sql`SELECT last_insert_rowid() as rowid`,
		)
		expect(unchangedRowId.rows![0]).toEqual([3])

		// Insert into users table and verify rowid changes
		await client.exec(`
			CREATE TABLE temp_users (
				id INTEGER PRIMARY KEY,
				name TEXT NOT NULL
			)
		`)

		await client.exec({
			sql: "INSERT INTO temp_users (name) VALUES (?)",
			bind: ["test user"],
		})

		const userRowId = await db.run(sql`SELECT last_insert_rowid() as rowid`)
		// Should be the auto-generated primary key value
		expect(userRowId.rows![0]).toEqual([1])

		// Clean up
		await client.close()
	})
})
