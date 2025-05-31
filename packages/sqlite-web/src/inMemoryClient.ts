import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import {
	CloseDatabaseArgs,
	CloseDatabaseResult,
	ExecArgs,
	ExecResult,
	ExportResult,
	OpenDatabaseArgs,
	SqliteClient,
	SqliteConfig,
	SqliteDatabase,
	SqliteRowEvent,
} from "./client"

/**
 * SQLite client that uses in-memory database with OO1 API.
 *
 * Note: this client works in node, but should not be used in production environment.
 */
export class SqliteInMemoryClient implements SqliteClient {
	private sqlite3: any
	private db: any
	private currentDatabase: SqliteDatabase | undefined

	/**
	 * Creates a new SqliteInMemoryClient instance
	 * @param sqlite3 The initialized sqlite3 module
	 */
	constructor(sqlite3: any) {
		this.sqlite3 = sqlite3
	}

	/**
	 * Creates a new SqliteInMemoryClient instance
	 * @returns Promise resolving to initialized client
	 */
	public static readonly create = async (): Promise<SqliteInMemoryClient> => {
		const sqlite3 = await sqlite3InitModule({
			print: console.log,
			printErr: console.error,
		})

		return new SqliteInMemoryClient(sqlite3)
	}

	/**
	 * Opens a database connection
	 * @param args Optional arguments for opening the database
	 * @returns Promise resolving to database information
	 */
	public readonly open = async (
		args: OpenDatabaseArgs = {},
	): Promise<SqliteDatabase> => {
		const { filename = ":memory:", vfs } = args

		// Create database using OO1 API
		this.db = new this.sqlite3.oo1.DB(filename, vfs ? { vfs } : undefined)

		this.currentDatabase = {
			dbId: this.db.pointer.toString(),
			filename,
			persistent: filename !== ":memory:",
			vfs: vfs || "default",
		}

		return this.currentDatabase
	}

	/**
	 * Closes the current database connection
	 * @param args Optional arguments for closing the database
	 * @returns Promise resolving to close result
	 */
	public readonly close = async (
		_args: CloseDatabaseArgs = {},
	): Promise<CloseDatabaseResult> => {
		const result: CloseDatabaseResult = {}

		if (this.db) {
			this.db.close()
			this.db = undefined
		}

		this.currentDatabase = undefined

		return result
	}

	/**
	 * Executes SQL statements
	 * @param sqlOrArgs SQL string or execution arguments
	 * @returns Promise resolving to execution result
	 */
	public readonly exec = async (
		sqlOrArgs: string | ExecArgs,
	): Promise<ExecResult> => {
		if (!this.db) {
			throw new Error("Database is not open")
		}

		const args =
			typeof sqlOrArgs === "string" ? { sql: sqlOrArgs } : sqlOrArgs
		const { sql, bind, callback, rowMode = "object", countChanges } = args

		if (!sql) {
			throw new Error("SQL statement is required")
		}

		const resultRows: unknown[] = []
		let changeCount = 0

		try {
			if (callback) {
				// Execute with row callback
				this.db.exec({
					sql,
					bind,
					rowMode,
					callback: (row: unknown, stmt: any) => {
						const columnNames = stmt.getColumnNames()
						const rowEvent: SqliteRowEvent = {
							type: "row",
							row,
							rowNumber: resultRows.length,
							columnNames,
						}
						callback(rowEvent)
						resultRows.push(row)
					},
				})
			} else {
				// Execute and collect all rows
				this.db.exec({
					sql,
					bind,
					rowMode,
					callback: (row: unknown) => {
						resultRows.push(row)
					},
				})
			}

			if (countChanges) {
				changeCount = this.db.changes()
			}
		} catch (error) {
			throw new Error(`SQL execution failed: ${error}`)
		}

		const execResult: ExecResult = {
			...args,
			resultRows,
		}

		if (countChanges) {
			execResult.changeCount = changeCount
		}

		return execResult
	}

	/**
	 * Exports the current database as a byte array
	 * @returns Promise resolving to export result
	 */
	public readonly export = async (): Promise<ExportResult> => {
		if (!this.db) {
			throw new Error("Database is not open")
		}

		const byteArray = this.sqlite3.capi.sqlite3_js_db_export(
			this.db.pointer,
		)

		return {
			byteArray,
			filename: this.currentDatabase?.filename || "database.sqlite3",
			mimetype: "application/x-sqlite3" as const,
		}
	}

	/**
	 * Gets the SQLite configuration
	 * @returns Promise resolving to configuration information
	 */
	public readonly getConfig = async (): Promise<SqliteConfig> => {
		return {
			version: this.sqlite3.version,
			bigIntEnabled: this.sqlite3.wasm.bigIntEnabled,
			vfsList: this.sqlite3.capi.sqlite3_js_vfs_list(),
		}
	}

	/**
	 * Gets the current database information
	 * @returns Current database or undefined if no database is open
	 */
	public readonly getCurrentDatabase = (): SqliteDatabase | undefined => {
		return this.currentDatabase
	}

	/**
	 * Checks if a database is currently open
	 * @returns True if a database is open, false otherwise
	 */
	public readonly isOpen = (): boolean => {
		return this.currentDatabase !== undefined && this.db !== undefined
	}

	/**
	 * Executes SQL with streaming row callback support
	 * @param sql SQL statement to execute
	 * @param onRow Callback function for each row
	 * @param options Additional execution options
	 * @returns Promise resolving to execution result
	 */
	public readonly execWithCallback = async (
		sql: string,
		onRow: (row: SqliteRowEvent) => void,
		options: Omit<ExecArgs, "sql" | "callback"> = {},
	): Promise<ExecResult> => {
		return this.exec({
			...options,
			sql,
			callback: onRow,
		})
	}
}
