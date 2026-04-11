CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`storage_key` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`composition_id` text NOT NULL,
	`description` text,
	`default_params` text NOT NULL,
	`preview_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `render_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`lyrics` text NOT NULL,
	`audio_asset_id` text NOT NULL,
	`params` text NOT NULL,
	`status` text NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`output_key` text,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`audio_asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE no action
);
