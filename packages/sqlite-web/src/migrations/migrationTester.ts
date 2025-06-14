import { SqliteClient } from "../client/client"
import { SqliteInMemoryClient } from "../client/inMemoryClient"
import { Migration } from "./migrator"

/**
 * Utility class for testing database migrations
 * Validates that all up and down migrations execute successfully
 */
export class MigrationTester {
	private readonly client: SqliteClient
	private readonly migrations: Migration[]

	private constructor(client: SqliteClient, migrations: Migration[]) {
		this.client = client
		this.migrations = migrations
	}

	/**
	 * Tests all migrations by applying and rolling back each one
	 * @param client SQLite client instance
	 * @param migrations Array of migrations to test
	 * @throws Error if any migration fails
	 */
	public static readonly testMigrations = async (
		client: SqliteClient,
		migrations: Migration[],
	): Promise<void> => {
		const tester = new MigrationTester(client, migrations)
		await tester.testAllMigrations()
	}

	/**
	 * Tests all migrations using an in-memory database
	 * Creates a fresh in-memory SQLite database and runs all migrations
	 * @param migrations Array of migrations to test
	 * @throws Error if any migration fails
	 */
	public static readonly testMigrationsInMemory = async (
		migrations: Migration[],
	): Promise<void> => {
		const client = await SqliteInMemoryClient.create()

		try {
			await client.open({ filename: ":memory:" })
			await MigrationTester.testMigrations(client, migrations)
		} finally {
			await client.close()
		}
	}

	/**
	 * Tests all migrations by applying up and down SQL for each migration
	 */
	private readonly testAllMigrations = async (): Promise<void> => {
		// Sort migrations by version to test in order
		const sortedMigrations = [...this.migrations].sort(
			(a, b) => a.version - b.version,
		)

		for (const migration of sortedMigrations) {
			await this.client.exec(migration.upSql)
		}
		const reversedMigrations = [...sortedMigrations].reverse()
		for (const migration of reversedMigrations) {
			await this.client.exec(migration.downSql)
		}
	}
}
