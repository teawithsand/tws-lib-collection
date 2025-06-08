import {
	foreignKey,
	integer,
	sqliteTable,
	text,
	unique,
} from "drizzle-orm/sqlite-core"

export const cardCollectionsTable = sqliteTable("card_collections", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	collectionHeader: text("collectionData", { mode: "json" }).notNull(),
})

export const cardsTable = sqliteTable(
	"cards",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		collectionId: integer("collection_id").notNull(),

		cardData: text("cardData", { mode: "json" }).notNull(),

		queue: integer().notNull(),
		priority: integer().notNull(),

		repeats: integer().notNull(),
		lapses: integer().notNull(),
	},
	(table) => [
		foreignKey({
			name: "collection_id_fk",
			columns: [table.collectionId],
			foreignColumns: [cardCollectionsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
	],
)

export const cardEventsTable = sqliteTable(
	"card_events",
	{
		id: integer().notNull().primaryKey({ autoIncrement: true }),
		cardId: integer("card_id").notNull(),
		collectionId: integer("collection_id").notNull(),

		event: text("event", { mode: "json" }).notNull(),
		state: text("state", { mode: "json" }).notNull(),

		ordinalNumber: integer().notNull(),
	},
	(table) => [
		foreignKey({
			name: "card_id_fk",
			columns: [table.cardId],
			foreignColumns: [cardsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			name: "collection_id_fk",
			columns: [table.collectionId],
			foreignColumns: [cardCollectionsTable.id],
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		unique("card_events_collection_ordinal_number_uniq").on(
			table.collectionId,
			table.ordinalNumber,
		),
	],
)
