import { Migration } from "@teawithsand/sqlite-web"

export const DB_MIGRATIONS: Migration[] = [
	{
		version: 1,
		id: "create_initial_schema",
		upSql: `
			CREATE TABLE card_collections (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				collectionData TEXT NOT NULL
			);
			
			CREATE TABLE cards (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				collection_id INTEGER NOT NULL,
				cardData TEXT NOT NULL,
				queue INTEGER NOT NULL,
				priority INTEGER NOT NULL,
				repeats INTEGER NOT NULL,
				lapses INTEGER NOT NULL,
				FOREIGN KEY (collection_id) REFERENCES card_collections(id) ON UPDATE CASCADE ON DELETE CASCADE
			);
			
			CREATE TABLE card_events (
				id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
				card_id INTEGER NOT NULL,
				collection_id INTEGER NOT NULL,
				event TEXT NOT NULL,
				state TEXT NOT NULL,
				ordinalNumber INTEGER NOT NULL,
				FOREIGN KEY (card_id) REFERENCES cards(id) ON UPDATE CASCADE ON DELETE CASCADE,
				FOREIGN KEY (collection_id) REFERENCES card_collections(id) ON UPDATE CASCADE ON DELETE CASCADE
			);
			
			CREATE UNIQUE INDEX card_events_collection_ordinal_number_uniq 
			ON card_events (collection_id, ordinalNumber);
		`,
		downSql: `
			DROP INDEX IF EXISTS card_events_collection_ordinal_number_uniq;
			DROP TABLE IF EXISTS card_events;
			DROP TABLE IF EXISTS cards;
			DROP TABLE IF EXISTS card_collections;
		`,
	},
]
