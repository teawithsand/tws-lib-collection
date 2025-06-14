import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { SqliteInMemoryClient } from "../client/inMemoryClient"
import { Migration, MigrationManager } from "./migrator"

describe("MigrationManager", () => {
	let client: SqliteInMemoryClient
	let migrationManager: MigrationManager

	const createTestMigrations = (): Migration[] => [
		{
			version: 1,
			id: "create_users_table",
			upSql: `
				CREATE TABLE users (
					id INTEGER PRIMARY KEY,
					name TEXT NOT NULL,
					email TEXT NOT NULL
				)
			`,
			downSql: "DROP TABLE users",
		},
		{
			version: 2,
			id: "add_users_created_at",
			upSql: "ALTER TABLE users ADD COLUMN created_at INTEGER",
			downSql: "ALTER TABLE users DROP COLUMN created_at",
		},
		{
			version: 3,
			id: "create_posts_table",
			upSql: `
				CREATE TABLE posts (
					id INTEGER PRIMARY KEY,
					user_id INTEGER NOT NULL,
					title TEXT NOT NULL,
					content TEXT,
					FOREIGN KEY (user_id) REFERENCES users(id)
				)
			`,
			downSql: "DROP TABLE posts",
		},
	]

	beforeEach(async () => {
		client = await SqliteInMemoryClient.create()
		await client.open()

		migrationManager = MigrationManager.createWithClient(client, {
			migrations: createTestMigrations(),
		})
	})

	afterEach(async () => {
		await client.close()
	})

	describe("constructor and validation", () => {
		test("should create migration manager with valid migrations", () => {
			expect(migrationManager).toBeDefined()
		})

		test("should throw error for duplicate migration versions", () => {
			const duplicateMigrations = [
				{
					version: 1,
					id: "first",
					upSql: "CREATE TABLE test1 (id INTEGER)",
					downSql: "DROP TABLE test1",
				},
				{
					version: 1,
					id: "second",
					upSql: "CREATE TABLE test2 (id INTEGER)",
					downSql: "DROP TABLE test2",
				},
			]

			expect(() => {
				MigrationManager.createWithClient(client, {
					migrations: duplicateMigrations,
				})
			}).toThrow("Duplicate migration version: 1")
		})

		test("should allow custom table name", async () => {
			const customManager = new MigrationManager(client, {
				tableName: "custom_migrations",
				migrations: createTestMigrations(),
			})

			// Initialize migrations by calling getCurrentVersion
			await customManager.getCurrentVersion()

			// Check that custom table was created
			const result = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='custom_migrations'",
				returnValue: "resultRows",
			})

			expect(result.resultRows).toHaveLength(1)
		})
	})

	describe("getCurrentVersion", () => {
		test("should return 0 for empty database", async () => {
			const version = await migrationManager.getCurrentVersion()
			expect(version).toBe(0)
		})

		test("should return highest applied migration version", async () => {
			// First call to getCurrentVersion initializes the table
			await migrationManager.getCurrentVersion()

			// Apply some migrations manually
			await client.exec({
				sql: "INSERT INTO schema_migrations (version, id, executed_at) VALUES (?, ?, ?)",
				bind: [1, "test1", Date.now()],
			})
			await client.exec({
				sql: "INSERT INTO schema_migrations (version, id, executed_at) VALUES (?, ?, ?)",
				bind: [3, "test3", Date.now()],
			})

			const version = await migrationManager.getCurrentVersion()
			expect(version).toBe(3)
		})

		test("should initialize migrations table automatically", async () => {
			await migrationManager.getCurrentVersion()

			// Check that table was created
			const result = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
				returnValue: "resultRows",
			})

			expect(result.resultRows).toHaveLength(1)
		})
	})

	describe("migrateToLatest", () => {
		test("should apply all pending migrations", async () => {
			const finalVersion = await migrationManager.migrateToLatest()

			expect(finalVersion).toBe(3)

			// Check that all tables were created
			const tableResult = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'posts') ORDER BY name",
				returnValue: "resultRows",
			})
			expect(tableResult.resultRows).toHaveLength(2)

			// Check current version
			const currentVersion = await migrationManager.getCurrentVersion()
			expect(currentVersion).toBe(3)

			// Verify users table structure
			const usersResult = await client.exec({
				sql: "PRAGMA table_info(users)",
				returnValue: "resultRows",
			})
			// Should have 4 columns: id, name, email, created_at
			expect(usersResult.resultRows).toHaveLength(4)
		})

		test("should apply only pending migrations when some are already applied", async () => {
			// Manually apply first migration
			await migrationManager.getCurrentVersion() // Initialize table
			await client.exec(
				"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL)",
			)
			await client.exec({
				sql: "INSERT INTO schema_migrations (version, id, executed_at) VALUES (?, ?, ?)",
				bind: [1, "create_users_table", Date.now()],
			})

			const finalVersion = await migrationManager.migrateToLatest()

			expect(finalVersion).toBe(3)

			// Check current version
			const currentVersion = await migrationManager.getCurrentVersion()
			expect(currentVersion).toBe(3)

			// Verify that both migrations 2 and 3 were applied
			const usersResult = await client.exec({
				sql: "PRAGMA table_info(users)",
				returnValue: "resultRows",
			})
			// Should have 4 columns: id, name, email, created_at
			expect(usersResult.resultRows).toHaveLength(4)

			const postsResult = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'",
				returnValue: "resultRows",
			})
			expect(postsResult.resultRows).toHaveLength(1)
		})

		test("should return current version when already at latest", async () => {
			await migrationManager.migrateToLatest()

			const finalVersion = await migrationManager.migrateToLatest()
			expect(finalVersion).toBe(3)
		})

		test("should handle empty migrations list", async () => {
			const emptyManager = new MigrationManager(client, {
				migrations: [],
			})

			const finalVersion = await emptyManager.migrateToLatest()
			expect(finalVersion).toBe(0)
		})

		test("should not apply same migration twice", async () => {
			await migrationManager.migrateToLatest()

			// Check that running migrateToLatest again doesn't change anything
			const finalVersion = await migrationManager.migrateToLatest()
			expect(finalVersion).toBe(3)

			// Verify all migrations were applied exactly once
			const result = await client.exec({
				sql: "SELECT COUNT(*) as count FROM schema_migrations",
				returnValue: "resultRows",
				rowMode: "object",
			})

			const row = result.resultRows![0] as any
			expect(row.count).toBe(3)
		})

		test("should work with non-sequential migration versions", async () => {
			const nonSequentialMigrations = [
				{
					version: 5,
					id: "migration_5",
					upSql: "CREATE TABLE test1 (id INTEGER)",
					downSql: "DROP TABLE test1",
				},
				{
					version: 10,
					id: "migration_10",
					upSql: "CREATE TABLE test2 (id INTEGER)",
					downSql: "DROP TABLE test2",
				},
				{
					version: 2,
					id: "migration_2",
					upSql: "CREATE TABLE test3 (id INTEGER)",
					downSql: "DROP TABLE test3",
				},
			]

			const nonSeqManager = new MigrationManager(client, {
				migrations: nonSequentialMigrations,
			})

			const finalVersion = await nonSeqManager.migrateToLatest()
			expect(finalVersion).toBe(10)

			const currentVersion = await nonSeqManager.getCurrentVersion()
			expect(currentVersion).toBe(10)

			// Check that all tables were created
			const tableResult = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'test%' ORDER BY name",
				returnValue: "resultRows",
			})
			expect(tableResult.resultRows).toHaveLength(3)
		})

		test("should handle new migrations added to partially migrated database", async () => {
			// Create initial migration manager with first 2 migrations
			const initialMigrations = [
				{
					version: 1,
					id: "create_users_table",
					upSql: `
						CREATE TABLE users (
							id INTEGER PRIMARY KEY,
							name TEXT NOT NULL,
							email TEXT NOT NULL
						)
					`,
					downSql: "DROP TABLE users",
				},
				{
					version: 2,
					id: "add_users_created_at",
					upSql: "ALTER TABLE users ADD COLUMN created_at INTEGER",
					downSql: "ALTER TABLE users DROP COLUMN created_at",
				},
			]

			const initialManager = new MigrationManager(client, {
				migrations: initialMigrations,
			})

			// Apply initial migrations
			const initialVersion = await initialManager.migrateToLatest()
			expect(initialVersion).toBe(2)

			// Verify initial state
			const currentVersion = await initialManager.getCurrentVersion()
			expect(currentVersion).toBe(2)

			// Verify users table exists with correct columns
			const usersResult = await client.exec({
				sql: "PRAGMA table_info(users)",
				returnValue: "resultRows",
			})
			expect(usersResult.resultRows).toHaveLength(4) // id, name, email, created_at

			// Now create a new migration manager with additional migrations
			const expandedMigrations = [
				...initialMigrations,
				{
					version: 3,
					id: "create_posts_table",
					upSql: `
						CREATE TABLE posts (
							id INTEGER PRIMARY KEY,
							user_id INTEGER NOT NULL,
							title TEXT NOT NULL,
							content TEXT,
							FOREIGN KEY (user_id) REFERENCES users(id)
						)
					`,
					downSql: "DROP TABLE posts",
				},
				{
					version: 4,
					id: "add_posts_published_at",
					upSql: "ALTER TABLE posts ADD COLUMN published_at INTEGER",
					downSql: "ALTER TABLE posts DROP COLUMN published_at",
				},
				{
					version: 5,
					id: "create_comments_table",
					upSql: `
						CREATE TABLE comments (
							id INTEGER PRIMARY KEY,
							post_id INTEGER NOT NULL,
							author_name TEXT NOT NULL,
							content TEXT NOT NULL,
							created_at INTEGER NOT NULL,
							FOREIGN KEY (post_id) REFERENCES posts(id)
						)
					`,
					downSql: "DROP TABLE comments",
				},
			]

			const expandedManager = new MigrationManager(client, {
				migrations: expandedMigrations,
			})

			// Apply new migrations
			const finalVersion = await expandedManager.migrateToLatest()
			expect(finalVersion).toBe(5)

			// Verify final state
			const finalCurrentVersion =
				await expandedManager.getCurrentVersion()
			expect(finalCurrentVersion).toBe(5)

			// Verify all tables were created
			const allTablesResult = await client.exec({
				sql: "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users', 'posts', 'comments') ORDER BY name",
				returnValue: "resultRows",
			})
			expect(allTablesResult.resultRows).toHaveLength(3)

			// Verify posts table structure includes published_at column
			const postsResult = await client.exec({
				sql: "PRAGMA table_info(posts)",
				returnValue: "resultRows",
			})
			expect(postsResult.resultRows).toHaveLength(5) // id, user_id, title, content, published_at

			// Verify comments table was created
			const commentsResult = await client.exec({
				sql: "PRAGMA table_info(comments)",
				returnValue: "resultRows",
			})
			expect(commentsResult.resultRows).toHaveLength(5) // id, post_id, author_name, content, created_at

			// Verify that all 5 migrations are recorded
			const migrationRecords = await client.exec({
				sql: "SELECT version, id FROM schema_migrations ORDER BY version",
				returnValue: "resultRows",
				rowMode: "object",
			})
			expect(migrationRecords.resultRows).toHaveLength(5)

			const records = migrationRecords.resultRows as any[]
			expect(records[0].version).toBe(1)
			expect(records[0].id).toBe("create_users_table")
			expect(records[1].version).toBe(2)
			expect(records[1].id).toBe("add_users_created_at")
			expect(records[2].version).toBe(3)
			expect(records[2].id).toBe("create_posts_table")
			expect(records[3].version).toBe(4)
			expect(records[3].id).toBe("add_posts_published_at")
			expect(records[4].version).toBe(5)
			expect(records[4].id).toBe("create_comments_table")

			// Verify that running migrateToLatest again doesn't change anything
			const unchangedVersion = await expandedManager.migrateToLatest()
			expect(unchangedVersion).toBe(5)

			// Verify migration count is still 5
			const finalMigrationCount = await client.exec({
				sql: "SELECT COUNT(*) as count FROM schema_migrations",
				returnValue: "resultRows",
				rowMode: "object",
			})
			const finalCount = (finalMigrationCount.resultRows![0] as any).count
			expect(finalCount).toBe(5)
		})
	})
})
