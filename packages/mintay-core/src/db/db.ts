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

export const DB_MIGRATIONS = new MintayMigrationCollection([
	new MintayDbMigration({
		up: `CREATE TABLE \`card_collections\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`collectionData\` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`card_events\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`card_id\` integer NOT NULL,
    \`collection_id\` integer NOT NULL,
    \`event\` text NOT NULL,
    \`state\` text NOT NULL,
    \`ordinalNumber\` integer NOT NULL,
    FOREIGN KEY (\`card_id\`) REFERENCES \`cards\`(\`id\`) ON UPDATE cascade ON DELETE cascade,
    FOREIGN KEY (\`collection_id\`) REFERENCES \`card_collections\`(\`id\`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX \`card_events_collection_ordinal_number_uniq\` ON \`card_events\` (\`collection_id\`,\`ordinalNumber\`);--> statement-breakpoint
CREATE TABLE \`cards\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`collection_id\` integer NOT NULL,
    \`cardData\` text NOT NULL,
    \`queue\` integer NOT NULL,
    \`priority\` integer NOT NULL,
    \`repeats\` integer NOT NULL,
    \`lapses\` integer NOT NULL,
    FOREIGN KEY (\`collection_id\`) REFERENCES \`card_collections\`(\`id\`) ON UPDATE cascade ON DELETE cascade
);`,
	}),
])
