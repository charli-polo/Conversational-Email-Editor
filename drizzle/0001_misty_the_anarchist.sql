PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agents` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`api_key` text NOT NULL,
	`base_url` text DEFAULT 'https://api.dify.ai' NOT NULL,
	`dify_url` text,
	`conversation_mode` text DEFAULT 'agent' NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_agents`("id", "label", "api_key", "base_url", "dify_url", "conversation_mode", "is_active", "created_at", "updated_at") SELECT "id", "label", "api_key", "base_url", "dify_url", "conversation_mode", "is_active", "created_at", "updated_at" FROM `agents`;--> statement-breakpoint
DROP TABLE `agents`;--> statement-breakpoint
ALTER TABLE `__new_agents` RENAME TO `agents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `messages` ADD `dify_message_id` text;--> statement-breakpoint
ALTER TABLE `messages` ADD `rating` text;