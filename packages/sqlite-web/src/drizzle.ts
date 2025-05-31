import { drizzle } from "drizzle-orm/sqlite-proxy"
import { SqliteClient } from "./client"

/**
 * Query method types supported by Drizzle ORM
 */
type DrizzleQueryMethod = "run" | "all" | "values" | "get"

/**
 * Result structure expected by Drizzle ORM
 */
interface DrizzleQueryResult {
	readonly rows: unknown[]
}

/**
 * Creates a Drizzle ORM instance using SqlitePromiser as the backend.
 * This function provides a bridge between Drizzle ORM's proxy interface
 * and the SqlitePromiser implementation.
 *
 * @param client - The SqliteWorkerClient instance to use for database operations
 * @returns A configured Drizzle ORM database instance
 *
 * @example
 * ```typescript
 * const promiser = await SqlitePromiser.create()
 * await promiser.open({ filename: 'file:mydb.sqlite3?vfs=opfs' })
 *
 * const db = createDrizzleFromPromiser(promiser)
 * const users = await db.select().from(usersTable)
 * ```
 */
export const createDrizzleFromPromiser = (client: SqliteClient) => {
	return drizzle(
		async (
			sql: string,
			params: unknown[],
			method: DrizzleQueryMethod,
		): Promise<DrizzleQueryResult> => {
			// Execute the SQL using the promiser with appropriate configuration
			const result = await client.exec({
				sql,
				bind: params,
				returnValue: "resultRows",
				rowMode: method === "get" ? "object" : "array",
			})

			// Return the result in the format expected by Drizzle
			return {
				rows: result.resultRows || [],
			}
		},
	)
}
