import { SqliteClient } from "../client/client"

/**
 * Represents a single database migration
 */
export interface Migration {
	readonly version: number
	readonly id: string
	readonly upSql: string
	readonly downSql: string
}

/**
 * Configuration for the migration manager
 */
export interface MigrationManagerConfig {
	readonly tableName?: string
	readonly migrations: Migration[]
}

/**
 * Drizzle database interface for migrations
 */
interface DrizzleDatabase {
	readonly run: (sql: string) => Promise<{ rows?: unknown[] }>
	readonly get: (sql: string) => Promise<unknown>
	readonly all: (sql: string) => Promise<unknown[]>
}

/**
 * Manages database migrations using a custom migrations table
 */
export class MigrationManager {
	private readonly client: SqliteClient
	private readonly tableName: string
	private readonly migrations: Map<number, Migration>

	constructor(
		client: SqliteClient,
		{ tableName = "schema_migrations", migrations }: MigrationManagerConfig,
	) {
		this.client = client
		this.tableName = tableName
		this.migrations = new Map()

		// Validate and store migrations
		for (const migration of migrations) {
			if (this.migrations.has(migration.version)) {
				throw new Error(
					`Duplicate migration version: ${migration.version}`,
				)
			}
			this.migrations.set(migration.version, migration)
		}
	}

	/**
	 * Creates a MigrationManager instance using SqliteClient
	 */
	public static readonly createWithClient = (
		client: SqliteClient,
		config: MigrationManagerConfig,
	): MigrationManager => {
		return new MigrationManager(client, config)
	}

	/**
	 * Creates a MigrationManager instance using Drizzle database
	 */
	public static readonly createWithDrizzle = (
		drizzle: DrizzleDatabase,
		config: MigrationManagerConfig,
	): MigrationManager => {
		// Create a SqliteClient adapter for Drizzle

		// Hack, but it will work for now
		const drizzleAdapter: SqliteClient = {
			open: async () => {
				throw new Error("Open not supported in Drizzle adapter")
			},
			close: async () => {
				throw new Error("Close not supported in Drizzle adapter")
			},
			exec: async (sqlOrArgs) => {
				const args =
					typeof sqlOrArgs === "string"
						? { sql: sqlOrArgs }
						: sqlOrArgs
				const { sql, bind, returnValue, rowMode } = args

				if (!sql) {
					throw new Error("SQL statement is required")
				}

				if (bind && bind.length > 0) {
					// For parameterized queries, we need to handle them differently
					// This is a simplified implementation - in production you might want more sophisticated parameter binding
					let parameterizedSql = sql
					if (bind.length > 0) {
						// Replace ? placeholders with actual values
						// Note: This is a basic implementation and might need enhancement for complex cases
						for (let i = 0; i < bind.length; i++) {
							const value = bind[i]
							const replacement =
								typeof value === "string"
									? `'${value}'`
									: String(value)
							parameterizedSql = parameterizedSql.replace(
								"?",
								replacement,
							)
						}
					}

					if (returnValue === "resultRows") {
						if (rowMode === "object") {
							const rows = await drizzle.all(parameterizedSql)
							return { resultRows: rows, ...args }
						} else {
							const rows = await drizzle.all(parameterizedSql)
							return { resultRows: rows, ...args }
						}
					} else {
						await drizzle.run(parameterizedSql)
						return { ...args }
					}
				} else {
					// No parameters
					if (returnValue === "resultRows") {
						if (rowMode === "object") {
							const rows = await drizzle.all(sql)
							return { resultRows: rows, ...args }
						} else {
							const rows = await drizzle.all(sql)
							return { resultRows: rows, ...args }
						}
					} else {
						await drizzle.run(sql)
						return { ...args }
					}
				}
			},
			export: async () => {
				throw new Error("Export not supported in Drizzle adapter")
			},
			getConfig: async () => {
				throw new Error("GetConfig not supported in Drizzle adapter")
			},
			getCurrentDatabase: () => undefined,
			isOpen: () => true,
			execWithCallback: async () => {
				throw new Error(
					"ExecWithCallback not supported in Drizzle adapter",
				)
			},
		}

		return new MigrationManager(drizzleAdapter, config)
	}

	/**
	 * Initializes the migrations table if it doesn't exist
	 */
	private readonly initializeMigrationsTable = async (): Promise<void> => {
		const createTableSql = `
			CREATE TABLE IF NOT EXISTS ${this.tableName} (
				version INTEGER PRIMARY KEY,
				id TEXT NOT NULL,
				executed_at INTEGER NOT NULL
			)
		`

		await this.client.exec(createTableSql)
	}

	/**
	 * Gets the current database version (highest applied migration version)
	 */
	public readonly getCurrentVersion = async (): Promise<number> => {
		await this.initializeMigrationsTable()

		const result = await this.client.exec({
			sql: `SELECT MAX(version) as max_version FROM ${this.tableName}`,
			returnValue: "resultRows",
			rowMode: "object",
		})

		if (!result.resultRows || result.resultRows.length === 0) {
			return 0
		}

		// Cast to any is necessary because resultRows type is not specific about object content
		const row = result.resultRows[0] as any
		const maxVersion = row?.max_version
		return maxVersion === null || maxVersion === undefined ? 0 : maxVersion
	}

	/**
	 * Checks if a specific migration version has been applied
	 */
	private readonly isMigrationApplied = async (
		version: number,
	): Promise<boolean> => {
		await this.initializeMigrationsTable()

		const result = await this.client.exec({
			sql: `SELECT COUNT(*) as count FROM ${this.tableName} WHERE version = ?`,
			bind: [version],
			returnValue: "resultRows",
			rowMode: "object",
		})

		if (!result.resultRows || result.resultRows.length === 0) {
			return false
		}

		// Cast to any is necessary because resultRows type is not specific about object content
		const row = result.resultRows[0] as any
		const count = row?.count
		return count > 0
	}

	/**
	 * Applies a single migration
	 */
	private readonly applyMigration = async (
		migration: Migration,
	): Promise<void> => {
		await this.initializeMigrationsTable()

		// Check if migration is already applied
		const isApplied = await this.isMigrationApplied(migration.version)
		if (isApplied) {
			throw new Error(
				`Migration version ${migration.version} is already applied`,
			)
		}

		// Execute the migration SQL
		await this.client.exec(migration.upSql)

		// Record the migration as applied
		await this.client.exec({
			sql: `INSERT INTO ${this.tableName} (version, id, executed_at) VALUES (?, ?, ?)`,
			bind: [migration.version, migration.id, Date.now()],
		})
	}

	/**
	 * Migrates to the latest version by applying all pending migrations
	 */
	public readonly migrateToLatest = async (): Promise<number> => {
		const currentVersion = await this.getCurrentVersion()
		const latestVersion = this.getLatestVersion()

		if (currentVersion >= latestVersion) {
			return currentVersion
		}

		// Apply all migrations from current to latest
		const versions = Array.from(this.migrations.keys())
			.filter((v) => v > currentVersion && v <= latestVersion)
			.sort((a, b) => a - b)

		for (const version of versions) {
			const migration = this.migrations.get(version)
			if (!migration) {
				throw new Error(`Migration for version ${version} not found`)
			}
			await this.applyMigration(migration)
		}

		return latestVersion
	}

	/**
	 * Gets the latest version from available migrations
	 */
	private readonly getLatestVersion = (): number => {
		const versions = Array.from(this.migrations.keys())
		return versions.length > 0 ? Math.max(...versions) : 0
	}
}
