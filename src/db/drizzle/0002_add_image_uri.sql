ALTER TABLE `templates` ADD `image_uri` text;
--> statement-breakpoint
ALTER TABLE `template_tools` ADD `image_uri` text;
--> statement-breakpoint
ALTER TABLE `template_consumables` ADD `image_uri` text;
--> statement-breakpoint
ALTER TABLE `template_tasks` ADD `image_uri` text;
