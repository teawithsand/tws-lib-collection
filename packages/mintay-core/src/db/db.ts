import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy"
import { z } from "zod"

export type MintayDrizzleDB = ReturnType<typeof drizzleProxy>
export type MintayDrizzleDBTx = Parameters<
	Parameters<MintayDrizzleDB["transaction"]>[0]
>[0]

const schema = z.tuple([z.number()])

export class MintayDbUtil {
	private constructor() {}

	public static readonly selectLastInsertId = async (
		db: MintayDrizzleDB | MintayDrizzleDBTx,
	): Promise<number> => {
		const res = await db.get(`SELECT last_insert_rowid()`)
		const parsed = schema.parse(res)
		return parsed[0]
	}
}

export class MintayDbMigration {
	public readonly up: string

	constructor({ up }: { up: string }) {
		this.up = up
	}
}

export class MintayMigrationCollection {
	constructor(public readonly migrations: MintayDbMigration[]) {}

	public readonly runMigrations = async (db: MintayDrizzleDB) => {
		for (const migration of this.migrations) {
			await db.run(migration.up)
		}
	}
}
