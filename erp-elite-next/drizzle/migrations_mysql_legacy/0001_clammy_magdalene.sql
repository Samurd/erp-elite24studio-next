ALTER TABLE `calendar_events` MODIFY COLUMN `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL;
--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_user_id_nextjs_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `nextjs_users`(`id`) ON DELETE cascade ON UPDATE no action;