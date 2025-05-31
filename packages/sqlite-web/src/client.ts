/**
 * Function signature for the SQLite promiser
 */
export interface SqlitePromiserFunction {
	(message: SqliteMessage): Promise<SqliteResponse>
	(type: string, args?: unknown): Promise<SqliteResponse>
}

/**
 * Interface for SQLite database operations
 */
export interface SqliteDatabase {
	dbId: string
	filename: string
	persistent: boolean
	vfs: string
}

/**
 * Configuration for the SQLite3 Worker1 Promiser
 */
export interface SqlitePromiserConfig {
	readonly worker?: Worker | (() => Worker)
	readonly generateMessageId?: (messageObject: SqliteMessage) => string
	readonly debug?: (...args: unknown[]) => void
	readonly onunhandled?: (event: MessageEvent) => void
	readonly onerror?: (...args: unknown[]) => void
	readonly onready?: (promiser: SqlitePromiserFunction) => void
}

/**
 * Base message structure for SQLite operations
 */
export interface SqliteMessage {
	type: string
	messageId?: string
	dbId?: string
	args?: unknown
	departureTime?: number
}

/**
 * Response structure from SQLite operations
 */
export interface SqliteResponse<T = unknown> {
	type: string
	messageId: string
	dbId?: string
	result: T
}

/**
 * Arguments for opening a database
 */
export interface OpenDatabaseArgs {
	filename?: string
	vfs?: string
}

/**
 * Result from opening a database
 */
export interface OpenDatabaseResult {
	filename: string
	dbId: string
	persistent: boolean
	vfs: string
}

/**
 * Arguments for closing a database
 */
export interface CloseDatabaseArgs {
	unlink?: boolean
}

/**
 * Result from closing a database
 */
export interface CloseDatabaseResult {
	filename?: string
}

/**
 * Arguments for executing SQL
 */
export interface ExecArgs {
	sql?: string
	bind?: unknown[]
	callback?: (row: SqliteRowEvent) => void
	rowMode?: "array" | "object" | "stmt"
	columnNames?: string[]
	returnValue?: "resultRows" | "saveSql"
	countChanges?: boolean | 64
	resultRows?: unknown[]
}

/**
 * Row event data for streaming results
 */
export interface SqliteRowEvent {
	type: string
	row: unknown
	rowNumber: number | null
	columnNames: string[]
}

/**
 * Result from executing SQL
 */
export interface ExecResult extends ExecArgs {
	changeCount?: number | bigint
}

/**
 * Result from exporting a database
 */
export interface ExportResult {
	byteArray: Uint8Array
	filename: string
	mimetype: "application/x-sqlite3"
}

/**
 * SQLite configuration information
 */
export interface SqliteConfig {
	version: Record<string, unknown>
	bigIntEnabled: boolean
	vfsList: string[]
}

/**
 * Interface defining the contract for SQLite promiser operations
 */
export interface SqliteClient {
	/**
	 * Opens a database connection
	 * @param args Optional arguments for opening the database
	 * @returns Promise resolving to database information
	 */
	readonly open: (args?: OpenDatabaseArgs) => Promise<SqliteDatabase>

	/**
	 * Closes the current database connection
	 * @param args Optional arguments for closing the database
	 * @returns Promise resolving to close result
	 */
	readonly close: (args?: CloseDatabaseArgs) => Promise<CloseDatabaseResult>

	/**
	 * Executes SQL statements
	 * @param sqlOrArgs SQL string or execution arguments
	 * @returns Promise resolving to execution result
	 */
	readonly exec: (sqlOrArgs: string | ExecArgs) => Promise<ExecResult>

	/**
	 * Exports the current database as a byte array
	 * @returns Promise resolving to export result
	 */
	readonly export: () => Promise<ExportResult>

	/**
	 * Gets the SQLite configuration
	 * @returns Promise resolving to configuration information
	 */
	readonly getConfig: () => Promise<SqliteConfig>

	/**
	 * Gets the current database information
	 * @returns Current database or undefined if no database is open
	 */
	readonly getCurrentDatabase: () => SqliteDatabase | undefined

	/**
	 * Checks if a database is currently open
	 * @returns True if a database is open, false otherwise
	 */
	readonly isOpen: () => boolean

	/**
	 * Executes SQL with streaming row callback support
	 * @param sql SQL statement to execute
	 * @param onRow Callback function for each row
	 * @param options Additional execution options
	 * @returns Promise resolving to execution result
	 */
	readonly execWithCallback: (
		sql: string,
		onRow: (row: SqliteRowEvent) => void,
		options?: Omit<ExecArgs, "sql" | "callback">,
	) => Promise<ExecResult>
}
