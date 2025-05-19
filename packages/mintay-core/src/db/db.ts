import { drizzle as drizzleProxy } from "drizzle-orm/sqlite-proxy"
import { z } from "zod"

export type DrizzleDB = ReturnType<typeof drizzleProxy>
export type DrizzleDBTx = Parameters<Parameters<DrizzleDB["transaction"]>[0]>[0]

const schema = z.tuple([z.number()])

export class DbUtil {
	private constructor() {}

	public static readonly selectLastInsertId = async (
		db: DrizzleDB | DrizzleDBTx,
	): Promise<number> => {
		const res = await db.get(`SELECT last_insert_rowid()`)
		const parsed = schema.parse(res)
		return parsed[0]
	}
}

export class DbMigration {
	public readonly up: string

	constructor({ up }: { up: string }) {
		this.up = up
	}
}

export class MigrationCollection {
	constructor(public readonly migrations: DbMigration[]) {}

	public readonly runMigrations = async (db: DrizzleDB) => {
		for (const migration of this.migrations) {
			await db.run(migration.up)
		}
	}
}

export const DB_MIGRATIONS = new MigrationCollection([
	new DbMigration({
		up: `-- filepath: /workspaces/sdelka-core/drizzle/0000_glossy_zarda.sql
CREATE TABLE \`card_collections\` (
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
    \`collection_id\` integer,
    \`cardData\` text NOT NULL,
    \`queue\` integer DEFAULT 0 NOT NULL,
    \`priority\` integer DEFAULT 0 NOT NULL,
    \`repeats\` integer DEFAULT 0 NOT NULL,
    \`lapses\` integer DEFAULT 0 NOT NULL,
    FOREIGN KEY (\`collection_id\`) REFERENCES \`card_collections\`(\`id\`) ON UPDATE cascade ON DELETE cascade
);
`,
	}),
])
