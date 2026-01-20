-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `adpieces` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`type_id` bigint unsigned,
	`format_id` bigint unsigned,
	`status_id` bigint unsigned,
	`project_id` bigint unsigned,
	`team_id` bigint unsigned,
	`strategy_id` bigint unsigned,
	`name` varchar(255) NOT NULL,
	`media` varchar(255),
	`instructions` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `adpieces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alliances` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type_id` bigint unsigned,
	`start_date` date,
	`validity` bigint,
	`certified` tinyint(1) NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `alliances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applicants` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`vacancy_id` bigint unsigned NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`status_id` bigint unsigned,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `applicants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`all_approvers` tinyint(1) NOT NULL DEFAULT 0,
	`buy` tinyint(1) NOT NULL DEFAULT 0,
	`status_id` bigint unsigned,
	`priority_id` bigint unsigned,
	`created_by_id` bigint unsigned,
	`approved_at` timestamp,
	`rejected_at` timestamp,
	`cancelled_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approvers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`approval_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`order` int unsigned,
	`status_id` bigint unsigned,
	`comment` text,
	`responded_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `approvers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apu_campaigns` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`campaign_id` bigint unsigned,
	`description` text NOT NULL,
	`quantity` bigint NOT NULL,
	`unit_id` bigint unsigned,
	`unit_price` bigint,
	`total_price` bigint,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `apu_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255),
	`slug` varchar(255) NOT NULL,
	`parent_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `areas_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `attendances` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned NOT NULL,
	`date` date NOT NULL,
	`check_in` time NOT NULL,
	`check_out` time NOT NULL,
	`status_id` bigint unsigned,
	`modality_id` bigint unsigned,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `attendances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audits` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`date_register` date NOT NULL,
	`date_audit` date NOT NULL,
	`objective` bigint NOT NULL,
	`type_id` bigint unsigned,
	`place` varchar(255),
	`status_id` bigint unsigned,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `birthdays` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`contact_id` bigint unsigned,
	`date` date NOT NULL,
	`whatsapp` varchar(255),
	`comments` text,
	`responsible_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `birthdays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buckets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`plan_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int NOT NULL DEFAULT 1,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `buckets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cache` (
	`key` varchar(255) NOT NULL,
	`value` mediumtext NOT NULL,
	`expiration` int NOT NULL,
	CONSTRAINT `cache_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `cache_locks` (
	`key` varchar(255) NOT NULL,
	`owner` varchar(255) NOT NULL,
	`expiration` int NOT NULL,
	CONSTRAINT `cache_locks_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_date` datetime NOT NULL,
	`end_date` datetime,
	`is_all_day` tinyint(1) NOT NULL DEFAULT 0,
	`color` varchar(255) NOT NULL DEFAULT '#3b82f6',
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`date_event` date,
	`address` varchar(255),
	`responsible_id` bigint unsigned,
	`status_id` bigint unsigned,
	`alliances` text,
	`goal` bigint,
	`estimated_budget` bigint,
	`description` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_marketings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`subject` varchar(255) NOT NULL,
	`project_id` bigint unsigned,
	`date` date,
	`mediums` varchar(255),
	`description` text,
	`responsible_id` bigint unsigned,
	`type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `case_marketings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `case_records` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`date` date,
	`description` text,
	`contact_id` bigint unsigned NOT NULL,
	`channel` text,
	`status_id` bigint unsigned,
	`case_type_id` bigint unsigned,
	`assigned_to_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `case_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`issued_at` date,
	`expires_at` date,
	`assigned_to_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `changes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`worksite_id` bigint unsigned NOT NULL,
	`change_date` date NOT NULL,
	`change_type_id` bigint unsigned,
	`requested_by` varchar(255),
	`description` text,
	`budget_impact_id` bigint unsigned,
	`status_id` bigint unsigned,
	`approved_by` bigint unsigned,
	`internal_notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `changes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channel_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`channel_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `channel_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`company` varchar(150),
	`email_personal` varchar(255),
	`email_corporativo` varchar(255),
	`phone` varchar(50),
	`address` varchar(255),
	`city` varchar(100),
	`first_contact_date` date,
	`notes` text,
	`contact_type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`relation_type_id` bigint unsigned,
	`source_id` bigint unsigned,
	`label_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	`deleted_at` timestamp,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`type_id` bigint unsigned,
	`category_id` bigint unsigned,
	`status_id` bigint unsigned,
	`start_date` date NOT NULL,
	`end_date` date,
	`schedule_id` bigint unsigned,
	`amount` bigint,
	`registered_by_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`parent_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `donations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`campaign_id` bigint unsigned,
	`amount` bigint NOT NULL,
	`payment_method` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`certified` tinyint(1) NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `donations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drizzle_migrations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`hash` text NOT NULL,
	`created_at` bigint,
	CONSTRAINT `drizzle_migrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `id` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`job_title` varchar(255) NOT NULL,
	`work_email` varchar(255) NOT NULL,
	`mobile_phone` varchar(255) NOT NULL,
	`curriculum_file` varchar(255),
	`work_address` text NOT NULL,
	`work_schedule` varchar(255) NOT NULL DEFAULT '40 hours/week',
	`home_address` text,
	`personal_email` varchar(255),
	`private_phone` varchar(255),
	`bank_account` varchar(255),
	`bank_certificate_file` varchar(255),
	`identification_number` varchar(255) NOT NULL,
	`social_security_number` varchar(255),
	`passport_number` varchar(255),
	`gender_id` bigint unsigned,
	`birth_date` date,
	`birth_place` varchar(255),
	`birth_country` varchar(255),
	`has_disability` tinyint(1) NOT NULL DEFAULT 0,
	`disability_details` text,
	`emergency_contact_name` varchar(255),
	`emergency_contact_phone` varchar(255),
	`education_type_id` bigint unsigned,
	`marital_status_id` bigint unsigned,
	`number_of_dependents` int NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`department_id` bigint unsigned,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_work_email_unique` UNIQUE(`work_email`),
	CONSTRAINT `employees_identification_number_unique` UNIQUE(`identification_number`)
);
--> statement-breakpoint
CREATE TABLE `event_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`event_id` bigint unsigned NOT NULL,
	`description` varchar(255) NOT NULL,
	`quantity` int NOT NULL,
	`unit_id` bigint unsigned,
	`unit_price` bigint NOT NULL,
	`total_price` bigint NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `event_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type_id` bigint unsigned,
	`event_date` date NOT NULL,
	`location` varchar(255),
	`status_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category_id` bigint unsigned,
	`description` text,
	`amount` bigint,
	`result_id` bigint unsigned,
	`date` date,
	`created_by_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failed_jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`uuid` varchar(255) NOT NULL,
	`connection` text NOT NULL,
	`queue` text NOT NULL,
	`payload` longtext NOT NULL,
	`exception` longtext NOT NULL,
	`failed_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `failed_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `failed_jobs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`path` varchar(255) NOT NULL,
	`disk` varchar(255) NOT NULL,
	`mime_type` varchar(255),
	`size` bigint unsigned,
	`folder_id` bigint unsigned,
	`user_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files_links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`area_id` bigint unsigned,
	`file_id` bigint unsigned NOT NULL,
	`fileable_type` varchar(255) NOT NULL,
	`fileable_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `files_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `files_links_unique` UNIQUE(`file_id`,`fileable_id`,`fileable_type`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`parent_id` bigint unsigned,
	`user_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`type_id` bigint unsigned,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`status_id` bigint unsigned,
	`approver_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type_id` bigint unsigned,
	`category_id` bigint unsigned,
	`description` text,
	`amount` bigint,
	`result_id` bigint unsigned,
	`date` date,
	`created_by_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `incomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inductions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`type_bond_id` bigint unsigned,
	`entry_date` date NOT NULL,
	`responsible_id` bigint unsigned,
	`date` date,
	`status_id` bigint unsigned,
	`confirmation_id` bigint unsigned,
	`resource` varchar(255),
	`duration` time,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `inductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`applicant_id` bigint unsigned NOT NULL,
	`date` date NOT NULL,
	`time` time,
	`interviewer_id` bigint unsigned,
	`interview_type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`result_id` bigint unsigned,
	`platform` varchar(255),
	`platform_url` varchar(255),
	`expected_results` text,
	`interviewer_observations` text,
	`rating` decimal(3,1),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`invoice_date` date NOT NULL,
	`code` varchar(255) NOT NULL,
	`contact_id` bigint unsigned,
	`description` text,
	`created_by_id` bigint unsigned,
	`total` bigint,
	`method_payment` varchar(255),
	`status_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_batches` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`total_jobs` int NOT NULL,
	`pending_jobs` int NOT NULL,
	`failed_jobs` int NOT NULL,
	`failed_job_ids` longtext NOT NULL,
	`options` mediumtext,
	`cancelled_at` int,
	`created_at` int NOT NULL,
	`finished_at` int,
	CONSTRAINT `job_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`queue` varchar(255) NOT NULL,
	`payload` longtext NOT NULL,
	`attempts` tinyint unsigned NOT NULL,
	`reserved_at` int unsigned,
	`available_at` int unsigned NOT NULL,
	`created_at` int unsigned NOT NULL,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kits` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`requested_by_user_id` bigint unsigned,
	`position_area` varchar(255) NOT NULL,
	`recipient_name` varchar(255) NOT NULL,
	`recipient_role` varchar(255) NOT NULL,
	`kit_type` varchar(255),
	`kit_contents` text,
	`request_date` date NOT NULL,
	`delivery_date` date,
	`status_id` bigint unsigned,
	`delivery_responsible_user_id` bigint unsigned,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `kits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_records` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`kpi_id` bigint unsigned NOT NULL,
	`record_date` date,
	`value` decimal(10,2),
	`observation` text,
	`created_by_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `kpi_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`protocol_code` varchar(255),
	`indicator_name` varchar(255) NOT NULL,
	`periodicity_days` int NOT NULL DEFAULT 30,
	`target_value` decimal(10,2),
	`role_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `kpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `license_status_updates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`license_id` bigint unsigned NOT NULL,
	`date` date,
	`responsible_id` bigint unsigned,
	`status_id` bigint unsigned,
	`description` text,
	`internal_notes` text,
	`created_by` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `license_status_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned,
	`license_type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`entity` varchar(255),
	`company` varchar(255),
	`eradicated_number` varchar(255),
	`eradicatd_date` date,
	`estimated_approval_date` date,
	`expiration_date` date,
	`requires_extension` tinyint(1) NOT NULL DEFAULT 0,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_responsibles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`meeting_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `meeting_responsibles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`team_id` bigint unsigned,
	`status_id` bigint unsigned,
	`notes` text,
	`url` varchar(255),
	`observations` text,
	`goal` tinyint(1) NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`bookingId` varchar(255),
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_mentions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`message_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `message_mentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_reactions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`message_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`emoji` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `message_reactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_reactions_message_id_user_id_unique` UNIQUE(`message_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`channel_id` bigint unsigned,
	`private_chat_id` bigint unsigned,
	`content` text,
	`type` varchar(255) NOT NULL DEFAULT 'text',
	`created_at` timestamp,
	`updated_at` timestamp,
	`parent_id` bigint unsigned,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`migration` varchar(255) NOT NULL,
	`batch` int NOT NULL,
	CONSTRAINT `migrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_has_permissions` (
	`permission_id` bigint unsigned NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint unsigned NOT NULL,
	CONSTRAINT `model_has_permissions_permission_id_model_id_model_type` PRIMARY KEY(`permission_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `model_has_roles` (
	`role_id` bigint unsigned NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint unsigned NOT NULL,
	CONSTRAINT `model_has_roles_role_id_model_id_model_type` PRIMARY KEY(`role_id`,`model_id`,`model_type`)
);
--> statement-breakpoint
CREATE TABLE `nextjs_accounts` (
	`id` varchar(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` text,
	`password` text,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `nextjs_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nextjs_sessions` (
	`id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `nextjs_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `token` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `nextjs_user_roles` (
	`user_id` varchar(36) NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	CONSTRAINT `nextjs_user_roles_user_id_role_id` PRIMARY KEY(`user_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `nextjs_users` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` tinyint(1) NOT NULL DEFAULT 0,
	`image` text,
	`created_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nextjs_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `nextjs_verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `nextjs_verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `norms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`user_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `norms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_templates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`type` enum('scheduled','recurring','reminder') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`user_id` bigint unsigned NOT NULL,
	`notifiable_type` varchar(255),
	`notifiable_id` bigint unsigned,
	`scheduled_at` timestamp,
	`recurring_pattern` json,
	`reminder_days` int,
	`event_date` timestamp,
	`last_sent_at` timestamp,
	`next_send_at` timestamp,
	`is_active` tinyint(1) NOT NULL DEFAULT 1,
	`send_email` tinyint(1) NOT NULL DEFAULT 0,
	`expires_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`template_id` bigint unsigned,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` json,
	`notifiable_type` varchar(255),
	`notifiable_id` bigint unsigned,
	`user_id` bigint unsigned NOT NULL,
	`read_at` timestamp,
	`sent_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oauth_connections` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`provider` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`email` varchar(255),
	`name` varchar(255),
	`avatar` varchar(255),
	`access_token` text,
	`refresh_token` text,
	`token_expires_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `oauth_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth_connections_user_id_provider_unique` UNIQUE(`user_id`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `off_boarding_tasks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`off_boarding_id` bigint unsigned NOT NULL,
	`content` text NOT NULL,
	`completed` tinyint(1) NOT NULL DEFAULT 0,
	`team_id` bigint unsigned,
	`completed_by` bigint unsigned,
	`completed_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `off_boarding_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `off_boardings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`project_id` bigint unsigned,
	`reason` text,
	`exit_date` date,
	`status_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `off_boardings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp,
	CONSTRAINT `password_reset_tokens_email` PRIMARY KEY(`email`)
);
--> statement-breakpoint
CREATE TABLE `payrolls` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`employee_id` bigint unsigned,
	`subtotal` bigint NOT NULL,
	`bonos` bigint,
	`deductions` bigint,
	`total` bigint NOT NULL,
	`status_id` bigint unsigned,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `payrolls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	`area_id` bigint unsigned,
	`action` varchar(255) NOT NULL,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissions_name_guard_name_area_id_unique` UNIQUE(`name`,`guard_name`,`area_id`)
);
--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tokenable_type` varchar(255) NOT NULL,
	`tokenable_id` bigint unsigned NOT NULL,
	`name` text NOT NULL,
	`token` varchar(64) NOT NULL,
	`abilities` text,
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `personal_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `personal_access_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned,
	`team_id` bigint unsigned,
	`owner_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`issued_at` date,
	`reviewed_at` date,
	`assigned_to_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_chat_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`private_chat_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `private_chat_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `private_chats` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`is_group` tinyint(1) NOT NULL DEFAULT 0,
	`name` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `private_chats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`direction` varchar(255),
	`contact_id` bigint unsigned,
	`status_id` bigint unsigned,
	`project_type_id` bigint unsigned,
	`current_stage_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`team_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `punch_items` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`worksite_id` bigint unsigned NOT NULL,
	`status_id` bigint unsigned,
	`observations` text,
	`responsible_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `punch_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`contact_id` bigint unsigned,
	`issued_at` date,
	`status_id` bigint unsigned,
	`total` bigint,
	`user_id` bigint unsigned,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status_id` bigint unsigned,
	`date` date,
	`hour` time,
	`user_id` bigint unsigned,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`permission_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	CONSTRAINT `role_has_permissions_permission_id_role_id` PRIMARY KEY(`permission_id`,`role_id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`display_name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_guard_name_unique` UNIQUE(`name`,`guard_name`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` bigint unsigned,
	`ip_address` varchar(45),
	`user_agent` text,
	`payload` longtext NOT NULL,
	`last_activity` int NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`shared_with_user_id` bigint unsigned,
	`shared_with_team_id` bigint unsigned,
	`shareable_type` varchar(255) NOT NULL,
	`shareable_id` bigint unsigned NOT NULL,
	`permission` enum('view','edit') NOT NULL DEFAULT 'view',
	`share_token` varchar(255),
	`expires_at` timestamp,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `shares_share_token_unique` UNIQUE(`share_token`)
);
--> statement-breakpoint
CREATE TABLE `social_media_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`mediums` varchar(255),
	`content_type` varchar(255),
	`piece_name` varchar(255),
	`scheduled_date` date,
	`project_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`status_id` bigint unsigned,
	`comments` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `social_media_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`objective` varchar(255),
	`status_id` bigint unsigned,
	`start_date` date,
	`end_date` date,
	`target_audience` varchar(255),
	`platforms` varchar(255),
	`responsible_id` bigint unsigned,
	`notify_team` tinyint(1) NOT NULL DEFAULT 0,
	`add_to_calendar` tinyint(1) NOT NULL DEFAULT 0,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`frequency_id` bigint unsigned,
	`type` varchar(255),
	`amount` bigint NOT NULL DEFAULT 0,
	`start_date` date,
	`renewal_date` date,
	`status_id` bigint unsigned,
	`user_id` bigint unsigned,
	`notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `subs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tag_categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`label` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `tag_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255),
	`color` varchar(255),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_category_id_name_unique` UNIQUE(`category_id`,`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `task_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`task_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `task_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`bucket_id` bigint unsigned NOT NULL,
	`order` int NOT NULL DEFAULT 1,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status_id` bigint unsigned,
	`priority_id` bigint unsigned,
	`created_by` bigint unsigned,
	`notes` varchar(255),
	`start_date` date,
	`due_date` date,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_records` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`entity` varchar(255) NOT NULL,
	`base` bigint NOT NULL,
	`porcentage` bigint NOT NULL,
	`amount` bigint NOT NULL,
	`date` date NOT NULL,
	`observations` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `tax_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_channels` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`is_private` tinyint(1) NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	`parent_id` bigint unsigned,
	CONSTRAINT `team_channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_channels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `team_roles` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `team_roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_roles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `team_user` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`team_id` bigint unsigned NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`role_id` bigint unsigned NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `team_user_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`profile_photo_path` varchar(2048),
	`isPublic` tinyint(1) NOT NULL DEFAULT 1,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified_at` timestamp,
	`password` varchar(255) NOT NULL,
	`two_factor_secret` text,
	`two_factor_recovery_codes` text,
	`two_factor_confirmed_at` timestamp,
	`remember_token` varchar(100),
	`current_team_id` bigint unsigned,
	`profile_photo_path` varchar(2048),
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `vacancies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`area` varchar(255),
	`contract_type_id` bigint unsigned,
	`published_at` date,
	`status_id` bigint unsigned,
	`user_id` bigint unsigned,
	`description` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `vacancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`worksite_id` bigint unsigned NOT NULL,
	`visit_date` date,
	`performed_by` bigint unsigned,
	`general_observations` text,
	`status_id` bigint unsigned,
	`internal_notes` text,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`campaign_id` bigint unsigned,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(255),
	`address` varchar(255),
	`city` varchar(255),
	`state` varchar(255),
	`country` varchar(255),
	`role` varchar(255),
	`status_id` bigint unsigned,
	`certified` tinyint(1) NOT NULL DEFAULT 0,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteers_email_unique` UNIQUE(`email`),
	CONSTRAINT `volunteers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `worksites` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`type_id` bigint unsigned,
	`status_id` bigint unsigned,
	`responsible_id` bigint unsigned,
	`address` varchar(255),
	`start_date` date,
	`end_date` date,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `worksites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `adpieces` ADD CONSTRAINT `adpieces_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adpieces` ADD CONSTRAINT `adpieces_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adpieces` ADD CONSTRAINT `adpieces_strategy_id_foreign` FOREIGN KEY (`strategy_id`) REFERENCES `strategies`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adpieces` ADD CONSTRAINT `adpieces_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `adpieces` ADD CONSTRAINT `adpieces_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alliances` ADD CONSTRAINT `alliances_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicants` ADD CONSTRAINT `applicants_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applicants` ADD CONSTRAINT `applicants_vacancy_id_foreign` FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_priority_id_foreign` FOREIGN KEY (`priority_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvers` ADD CONSTRAINT `approvers_approval_id_foreign` FOREIGN KEY (`approval_id`) REFERENCES `approvals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvers` ADD CONSTRAINT `approvers_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvers` ADD CONSTRAINT `approvers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apu_campaigns` ADD CONSTRAINT `apu_campaigns_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apu_campaigns` ADD CONSTRAINT `apu_campaigns_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `areas` ADD CONSTRAINT `areas_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `areas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_modality_id_foreign` FOREIGN KEY (`modality_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audits` ADD CONSTRAINT `audits_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audits` ADD CONSTRAINT `audits_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `birthdays` ADD CONSTRAINT `birthdays_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `birthdays` ADD CONSTRAINT `birthdays_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `birthdays` ADD CONSTRAINT `birthdays_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buckets` ADD CONSTRAINT `buckets_plan_id_foreign` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_user_id_nextjs_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `nextjs_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_marketings` ADD CONSTRAINT `case_marketings_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_marketings` ADD CONSTRAINT `case_marketings_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_marketings` ADD CONSTRAINT `case_marketings_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_marketings` ADD CONSTRAINT `case_marketings_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_records` ADD CONSTRAINT `case_records_assigned_to_id_foreign` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_records` ADD CONSTRAINT `case_records_case_type_id_foreign` FOREIGN KEY (`case_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_records` ADD CONSTRAINT `case_records_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_records` ADD CONSTRAINT `case_records_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_assigned_to_id_foreign` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `changes` ADD CONSTRAINT `changes_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `changes` ADD CONSTRAINT `changes_budget_impact_id_foreign` FOREIGN KEY (`budget_impact_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `changes` ADD CONSTRAINT `changes_change_type_id_foreign` FOREIGN KEY (`change_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `changes` ADD CONSTRAINT `changes_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `changes` ADD CONSTRAINT `changes_worksite_id_foreign` FOREIGN KEY (`worksite_id`) REFERENCES `worksites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_user` ADD CONSTRAINT `channel_user_channel_id_foreign` FOREIGN KEY (`channel_id`) REFERENCES `team_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_user` ADD CONSTRAINT `channel_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_contact_type_id_foreign` FOREIGN KEY (`contact_type_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_label_id_foreign` FOREIGN KEY (`label_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_relation_type_id_foreign` FOREIGN KEY (`relation_type_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_source_id_foreign` FOREIGN KEY (`source_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_registered_by_id_foreign` FOREIGN KEY (`registered_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_schedule_id_foreign` FOREIGN KEY (`schedule_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `departments` ADD CONSTRAINT `departments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `donations` ADD CONSTRAINT `donations_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_education_type_id_foreign` FOREIGN KEY (`education_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_gender_id_foreign` FOREIGN KEY (`gender_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employees` ADD CONSTRAINT `employees_marital_status_id_foreign` FOREIGN KEY (`marital_status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_items` ADD CONSTRAINT `event_items_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_items` ADD CONSTRAINT `event_items_unit_id_foreign` FOREIGN KEY (`unit_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_result_id_foreign` FOREIGN KEY (`result_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_folder_id_foreign` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files_links` ADD CONSTRAINT `files_links_area_id_foreign` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files_links` ADD CONSTRAINT `files_links_file_id_foreign` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_approver_id_foreign` FOREIGN KEY (`approver_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_result_id_foreign` FOREIGN KEY (`result_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inductions` ADD CONSTRAINT `inductions_confirmation_id_foreign` FOREIGN KEY (`confirmation_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inductions` ADD CONSTRAINT `inductions_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inductions` ADD CONSTRAINT `inductions_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inductions` ADD CONSTRAINT `inductions_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inductions` ADD CONSTRAINT `inductions_type_bond_id_foreign` FOREIGN KEY (`type_bond_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_interviewer_id_foreign` FOREIGN KEY (`interviewer_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_interview_type_id_foreign` FOREIGN KEY (`interview_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_result_id_foreign` FOREIGN KEY (`result_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `interviews` ADD CONSTRAINT `interviews_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kits` ADD CONSTRAINT `kits_delivery_responsible_user_id_foreign` FOREIGN KEY (`delivery_responsible_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kits` ADD CONSTRAINT `kits_requested_by_user_id_foreign` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kits` ADD CONSTRAINT `kits_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kpi_records` ADD CONSTRAINT `kpi_records_created_by_id_foreign` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kpi_records` ADD CONSTRAINT `kpi_records_kpi_id_foreign` FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kpis` ADD CONSTRAINT `kpis_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_status_updates` ADD CONSTRAINT `license_status_updates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_status_updates` ADD CONSTRAINT `license_status_updates_license_id_foreign` FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_status_updates` ADD CONSTRAINT `license_status_updates_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `license_status_updates` ADD CONSTRAINT `license_status_updates_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_license_type_id_foreign` FOREIGN KEY (`license_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_responsibles` ADD CONSTRAINT `meeting_responsibles_meeting_id_foreign` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meeting_responsibles` ADD CONSTRAINT `meeting_responsibles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_mentions` ADD CONSTRAINT `message_mentions_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_mentions` ADD CONSTRAINT `message_mentions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_message_id_foreign` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `message_reactions` ADD CONSTRAINT `message_reactions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_channel_id_foreign` FOREIGN KEY (`channel_id`) REFERENCES `team_channels`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_private_chat_id_foreign` FOREIGN KEY (`private_chat_id`) REFERENCES `private_chats`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nextjs_user_roles` ADD CONSTRAINT `nextjs_user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `nextjs_users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `nextjs_user_roles` ADD CONSTRAINT `nextjs_user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `norms` ADD CONSTRAINT `norms_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_template_id_foreign` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `oauth_connections` ADD CONSTRAINT `oauth_connections_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boarding_tasks` ADD CONSTRAINT `off_boarding_tasks_completed_by_foreign` FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boarding_tasks` ADD CONSTRAINT `off_boarding_tasks_off_boarding_id_foreign` FOREIGN KEY (`off_boarding_id`) REFERENCES `off_boardings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boarding_tasks` ADD CONSTRAINT `off_boarding_tasks_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boardings` ADD CONSTRAINT `off_boardings_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boardings` ADD CONSTRAINT `off_boardings_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boardings` ADD CONSTRAINT `off_boardings_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `off_boardings` ADD CONSTRAINT `off_boardings_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payrolls` ADD CONSTRAINT `payrolls_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_area_id_foreign` FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plans` ADD CONSTRAINT `plans_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plans` ADD CONSTRAINT `plans_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plans` ADD CONSTRAINT `plans_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policies` ADD CONSTRAINT `policies_assigned_to_id_foreign` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policies` ADD CONSTRAINT `policies_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policies` ADD CONSTRAINT `policies_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_chat_user` ADD CONSTRAINT `private_chat_user_private_chat_id_foreign` FOREIGN KEY (`private_chat_id`) REFERENCES `private_chats`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `private_chat_user` ADD CONSTRAINT `private_chat_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_current_stage_id_foreign` FOREIGN KEY (`current_stage_id`) REFERENCES `stages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_project_type_id_foreign` FOREIGN KEY (`project_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `punch_items` ADD CONSTRAINT `punch_items_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `punch_items` ADD CONSTRAINT `punch_items_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `punch_items` ADD CONSTRAINT `punch_items_worksite_id_foreign` FOREIGN KEY (`worksite_id`) REFERENCES `worksites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shares` ADD CONSTRAINT `shares_shared_with_team_id_foreign` FOREIGN KEY (`shared_with_team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shares` ADD CONSTRAINT `shares_shared_with_user_id_foreign` FOREIGN KEY (`shared_with_user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shares` ADD CONSTRAINT `shares_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_media_posts` ADD CONSTRAINT `social_media_posts_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_media_posts` ADD CONSTRAINT `social_media_posts_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `social_media_posts` ADD CONSTRAINT `social_media_posts_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategies` ADD CONSTRAINT `strategies_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategies` ADD CONSTRAINT `strategies_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subs` ADD CONSTRAINT `subs_frequency_id_foreign` FOREIGN KEY (`frequency_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subs` ADD CONSTRAINT `subs_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subs` ADD CONSTRAINT `subs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `tag_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_user` ADD CONSTRAINT `task_user_task_id_foreign` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_user` ADD CONSTRAINT `task_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_bucket_id_foreign` FOREIGN KEY (`bucket_id`) REFERENCES `buckets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_priority_id_foreign` FOREIGN KEY (`priority_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tax_records` ADD CONSTRAINT `tax_records_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tax_records` ADD CONSTRAINT `tax_records_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_channels` ADD CONSTRAINT `team_channels_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `team_channels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_channels` ADD CONSTRAINT `team_channels_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_user` ADD CONSTRAINT `team_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `team_roles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_user` ADD CONSTRAINT `team_user_team_id_foreign` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_user` ADD CONSTRAINT `team_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacancies` ADD CONSTRAINT `vacancies_contract_type_id_foreign` FOREIGN KEY (`contract_type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacancies` ADD CONSTRAINT `vacancies_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vacancies` ADD CONSTRAINT `vacancies_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_performed_by_foreign` FOREIGN KEY (`performed_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_worksite_id_foreign` FOREIGN KEY (`worksite_id`) REFERENCES `worksites`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `volunteers` ADD CONSTRAINT `volunteers_campaign_id_foreign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `volunteers` ADD CONSTRAINT `volunteers_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worksites` ADD CONSTRAINT `worksites_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worksites` ADD CONSTRAINT `worksites_responsible_id_foreign` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worksites` ADD CONSTRAINT `worksites_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `worksites` ADD CONSTRAINT `worksites_type_id_foreign` FOREIGN KEY (`type_id`) REFERENCES `tags`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `adpieces_format_id_foreign` ON `adpieces` (`format_id`);--> statement-breakpoint
CREATE INDEX `files_links_fileable_type_fileable_id_index` ON `files_links` (`fileable_type`,`fileable_id`);--> statement-breakpoint
CREATE INDEX `jobs_queue_index` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `model_has_permissions_model_id_model_type_index` ON `model_has_permissions` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `model_has_roles_model_id_model_type_index` ON `model_has_roles` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `user_id` ON `nextjs_accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id` ON `nextjs_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `role_id` ON `nextjs_user_roles` (`role_id`);--> statement-breakpoint
CREATE INDEX `notification_templates_notifiable_type_notifiable_id_index` ON `notification_templates` (`notifiable_type`,`notifiable_id`);--> statement-breakpoint
CREATE INDEX `notification_templates_type_is_active_next_send_at_index` ON `notification_templates` (`type`,`is_active`,`next_send_at`);--> statement-breakpoint
CREATE INDEX `notification_templates_user_id_is_active_index` ON `notification_templates` (`user_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `notifications_notifiable_type_notifiable_id_index` ON `notifications` (`notifiable_type`,`notifiable_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_read_at_index` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_status_index` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `permissions_area_id_index` ON `permissions` (`area_id`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` ON `personal_access_tokens` (`tokenable_type`,`tokenable_id`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_expires_at_index` ON `personal_access_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_last_activity_index` ON `sessions` (`last_activity`);--> statement-breakpoint
CREATE INDEX `shares_shareable_type_shareable_id_index` ON `shares` (`shareable_type`,`shareable_id`);
*/