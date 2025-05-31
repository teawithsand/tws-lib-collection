import { drizzle } from "drizzle-orm/sqlite-proxy"
import { SqliteClient } from "./client"

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
export const createDrizzleFromClient = (
	client: SqliteClient,
): ReturnType<typeof drizzle> => {
	return drizzle(async (sql: string, params: unknown[], method) => {
		// Execute the SQL using the client with appropriate configuration
		const result = await client.exec({
			sql,
			bind: params,
			returnValue: "resultRows",
			rowMode: "array",
		})

		if (method === "get") {
			return {
				rows: result.resultRows![0] as unknown[], // in reality drizzle expects undefined here as well, but TS does not allow for it.
			}
		}

		return {
			rows: result.resultRows || [],
		}
	})
}
