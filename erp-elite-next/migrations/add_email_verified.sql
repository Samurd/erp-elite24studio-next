-- Add email_verified column to users table for Better-Auth compatibility
-- This is a safe migration that only adds a new column

ALTER TABLE `users` 
ADD COLUMN `email_verified` tinyint(1) NOT NULL DEFAULT 0 
AFTER `email`;

-- Sync email_verified with email_verified_at for existing users
UPDATE `users` 
SET `email_verified` = 1 
WHERE `email_verified_at` IS NOT NULL;
