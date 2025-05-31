import {
	CloseDatabaseArgs,
	CloseDatabaseResult,
	ExecArgs,
	ExecResult,
	ExportResult,
	OpenDatabaseArgs,
	OpenDatabaseResult,
	SqliteClient,
	SqliteConfig,
	SqliteDatabase,
	SqlitePromiserFunction,
	SqliteRowEvent,
} from "./client"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - The type definitions for sqlite-wasm are incomplete
import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm"

/**
 * SQLite client, which uses web workers. Supports OPFS VFS.
 */
export class SqliteWorkerClient implements SqliteClient {
	private readonly promiserFunction: SqlitePromiserFunction
	private currentDatabase: SqliteDatabase | undefined

	/**
	 * Creates a new SqlitePromiser instance
	 * @param promiserFunction The underlying promiser function from sqlite3Worker1Promiser
	 */
	constructor(promiserFunction: SqlitePromiserFunction) {
		this.promiserFunction = promiserFunction
	}

	public static readonly create = async () => {
		const rawPromiser: any = await new Promise((resolve) => {
			const _promiser = sqlite3Worker1Promiser({
				onready: () => resolve(_promiser),
			})
		})

		return new SqliteWorkerClient(rawPromiser)
	}

	/**
	 * Opens a database connection
	 * @param args Optional arguments for opening the database
	 * @returns Promise resolving to database information
	 */
	public readonly open = async (
		args: OpenDatabaseArgs = {},
	): Promise<SqliteDatabase> => {
		const response = await this.promiserFunction("open", args)
		const result = response.result as OpenDatabaseResult

		this.currentDatabase = {
			dbId: result.dbId,
			filename: result.filename,
			persistent: result.persistent,
			vfs: result.vfs,
		}

		return this.currentDatabase
	}

	/**
	 * Closes the current database connection
	 * @param args Optional arguments for closing the database
	 * @returns Promise resolving to close result
	 */
	public readonly close = async (
		args: CloseDatabaseArgs = {},
	): Promise<CloseDatabaseResult> => {
		const response = await this.promiserFunction("close", args)
		const result = response.result as CloseDatabaseResult

		if (this.currentDatabase) {
			this.currentDatabase = undefined
		}

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
		const args =
			typeof sqlOrArgs === "string" ? { sql: sqlOrArgs } : sqlOrArgs

		const response = await this.promiserFunction("exec", args)
		return response.result as ExecResult
	}

	/**
	 * Exports the current database as a byte array
	 * @returns Promise resolving to export result
	 */
	public readonly export = async (): Promise<ExportResult> => {
		const response = await this.promiserFunction("export")
		return response.result as ExportResult
	}

	/**
	 * Gets the SQLite configuration
	 * @returns Promise resolving to configuration information
	 */
	public readonly getConfig = async (): Promise<SqliteConfig> => {
		const response = await this.promiserFunction("config-get", {})
		return response.result as SqliteConfig
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
		return this.currentDatabase !== undefined
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
