CREATE TABLE `clients` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`balance` real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` integer,
	`amount` real NOT NULL,
	`created_at` text,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
