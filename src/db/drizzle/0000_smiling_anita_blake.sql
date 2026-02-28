CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit_default` text,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `run_required_items` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`item_id` text NOT NULL,
	`requirement_type` text NOT NULL,
	`required_quantity` real,
	`unit` text,
	`status` text DEFAULT 'missing' NOT NULL,
	`linked_shopping_item_id` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `run_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`template_task_id` text NOT NULL,
	`due_at` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` text,
	`note` text,
	`reminder_enabled` integer DEFAULT true NOT NULL,
	`notification_id` text,
	`notification_scheduled_at` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_task_id`) REFERENCES `template_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`start_date` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopping_list_items` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`quantity` real,
	`unit` text,
	`checked` integer DEFAULT false NOT NULL,
	`store_note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shopping_list_links` (
	`id` text PRIMARY KEY NOT NULL,
	`shopping_list_item_id` text NOT NULL,
	`run_id` text,
	`template_id` text,
	FOREIGN KEY (`shopping_list_item_id`) REFERENCES `shopping_list_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_consumables` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_links` (
	`from_template_id` text NOT NULL,
	`to_template_id` text NOT NULL,
	`link_type` text NOT NULL,
	`label` text NOT NULL,
	FOREIGN KEY (`from_template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`task_type` text NOT NULL,
	`window_start_day` integer NOT NULL,
	`window_end_day` integer NOT NULL,
	`time_of_day` text,
	`is_repeating` integer DEFAULT false NOT NULL,
	`daily_times` text,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `template_tools` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`difficulty` text NOT NULL,
	`estimated_daily_time_mins` integer NOT NULL,
	`total_duration_days` integer NOT NULL,
	`environment` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`default_reminder_times_by_task_type` text,
	`quiet_hours` text
);
