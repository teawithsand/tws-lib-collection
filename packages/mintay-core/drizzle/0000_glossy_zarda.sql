CREATE TABLE `card_collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collectionData` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `card_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_id` integer NOT NULL,
	`collection_id` integer NOT NULL,
	`event` text NOT NULL,
	`state` text NOT NULL,
	`ordinalNumber` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `card_collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_events_collection_ordinal_number_uniq` ON `card_events` (`collection_id`,`ordinalNumber`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`collection_id` integer,
	`cardData` text NOT NULL,
	`queue` integer DEFAULT 0 NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`repeats` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`collection_id`) REFERENCES `card_collections`(`id`) ON UPDATE cascade ON DELETE cascade
);
