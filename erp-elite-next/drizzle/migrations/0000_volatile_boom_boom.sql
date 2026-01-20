CREATE TABLE "accounts" (
	"id" varchar(36) NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "accounts_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "adpieces" (
	"id" bigserial NOT NULL,
	"type_id" bigint,
	"format_id" bigint,
	"status_id" bigint,
	"project_id" bigint,
	"team_id" bigint,
	"strategy_id" bigint,
	"name" varchar(255) NOT NULL,
	"media" varchar(255),
	"instructions" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "adpieces_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "alliances" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"type_id" bigint,
	"start_date" date,
	"validity" bigint,
	"certified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "alliances_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" bigserial NOT NULL,
	"vacancy_id" bigint NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"status_id" bigint,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "applicants_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"all_approvers" boolean DEFAULT false NOT NULL,
	"buy" boolean DEFAULT false NOT NULL,
	"status_id" bigint,
	"priority_id" bigint,
	"created_by_id" varchar(36),
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "approvals_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "approvers" (
	"id" bigserial NOT NULL,
	"approval_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"order" integer,
	"status_id" bigint,
	"comment" text,
	"responded_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "approvers_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "apu_campaigns" (
	"id" bigserial NOT NULL,
	"campaign_id" bigint,
	"description" text NOT NULL,
	"quantity" bigint NOT NULL,
	"unit_id" bigint,
	"unit_price" bigint,
	"total_price" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "apu_campaigns_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"slug" varchar(255) NOT NULL,
	"parent_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "areas_id" PRIMARY KEY("id"),
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" bigserial NOT NULL,
	"employee_id" bigint NOT NULL,
	"date" date NOT NULL,
	"check_in" time NOT NULL,
	"check_out" time NOT NULL,
	"status_id" bigint,
	"modality_id" bigint,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "attendances_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" bigserial NOT NULL,
	"date_register" date NOT NULL,
	"date_audit" date NOT NULL,
	"objective" bigint NOT NULL,
	"type_id" bigint,
	"place" varchar(255),
	"status_id" bigint,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "audits_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "birthdays" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"contact_id" bigint,
	"date" date NOT NULL,
	"whatsapp" varchar(255),
	"comments" text,
	"responsible_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "birthdays_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "buckets" (
	"id" bigserial NOT NULL,
	"plan_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "buckets_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "cache" (
	"key" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expiration" integer NOT NULL,
	CONSTRAINT "cache_key" PRIMARY KEY("key")
);
--> statement-breakpoint
CREATE TABLE "cache_locks" (
	"key" varchar(255) NOT NULL,
	"owner" varchar(255) NOT NULL,
	"expiration" integer NOT NULL,
	CONSTRAINT "cache_locks_key" PRIMARY KEY("key")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" bigserial NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"color" varchar(255) DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "calendar_events_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"date_event" date,
	"address" varchar(255),
	"responsible_id" varchar(36),
	"status_id" bigint,
	"alliances" text,
	"goal" bigint,
	"estimated_budget" bigint,
	"description" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "campaigns_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "case_marketings" (
	"id" bigserial NOT NULL,
	"subject" varchar(255) NOT NULL,
	"project_id" bigint,
	"date" date,
	"mediums" varchar(255),
	"description" text,
	"responsible_id" varchar(36),
	"type_id" bigint,
	"status_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "case_marketings_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "case_records" (
	"id" bigserial NOT NULL,
	"date" date,
	"description" text,
	"contact_id" bigint NOT NULL,
	"channel" text,
	"status_id" bigint,
	"case_type_id" bigint,
	"assigned_to_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "case_records_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type_id" bigint,
	"status_id" bigint,
	"issued_at" date,
	"expires_at" date,
	"assigned_to_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "certificates_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "changes" (
	"id" bigserial NOT NULL,
	"worksite_id" bigint NOT NULL,
	"change_date" date NOT NULL,
	"change_type_id" bigint,
	"requested_by" varchar(255),
	"description" text,
	"budget_impact_id" bigint,
	"status_id" bigint,
	"approved_by" varchar(36),
	"internal_notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "changes_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "channel_user" (
	"id" bigserial NOT NULL,
	"channel_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "channel_user_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" bigserial NOT NULL,
	"name" varchar(150) NOT NULL,
	"company" varchar(150),
	"email_personal" varchar(255),
	"email_corporativo" varchar(255),
	"phone" varchar(50),
	"address" varchar(255),
	"city" varchar(100),
	"first_contact_date" date,
	"notes" text,
	"contact_type_id" bigint,
	"status_id" bigint,
	"relation_type_id" bigint,
	"source_id" bigint,
	"label_id" bigint,
	"responsible_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "contacts_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"type_id" bigint,
	"category_id" bigint,
	"status_id" bigint,
	"start_date" date NOT NULL,
	"end_date" date,
	"schedule_id" bigint,
	"amount" bigint,
	"registered_by_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "contracts_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "departments_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"campaign_id" bigint,
	"amount" bigint DEFAULT 0 NOT NULL,
	"payment_method" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"certified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "donations_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" bigserial NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"work_email" varchar(255) NOT NULL,
	"mobile_phone" varchar(255) NOT NULL,
	"curriculum_file" varchar(255),
	"work_address" text NOT NULL,
	"work_schedule" varchar(255) DEFAULT '40 hours/week' NOT NULL,
	"home_address" text,
	"personal_email" varchar(255),
	"private_phone" varchar(255),
	"bank_account" varchar(255),
	"bank_certificate_file" varchar(255),
	"identification_number" varchar(255) NOT NULL,
	"social_security_number" varchar(255),
	"passport_number" varchar(255),
	"gender_id" bigint,
	"birth_date" date,
	"birth_place" varchar(255),
	"birth_country" varchar(255),
	"has_disability" boolean DEFAULT false NOT NULL,
	"disability_details" text,
	"emergency_contact_name" varchar(255),
	"emergency_contact_phone" varchar(255),
	"education_type_id" bigint,
	"marital_status_id" bigint,
	"number_of_dependents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"department_id" bigint,
	CONSTRAINT "employees_id" PRIMARY KEY("id"),
	CONSTRAINT "employees_work_email_unique" UNIQUE("work_email"),
	CONSTRAINT "employees_identification_number_unique" UNIQUE("identification_number")
);
--> statement-breakpoint
CREATE TABLE "event_items" (
	"id" bigserial NOT NULL,
	"event_id" bigint NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_id" bigint,
	"unit_price" bigint NOT NULL,
	"total_price" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "event_items_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"type_id" bigint,
	"event_date" date NOT NULL,
	"location" varchar(255),
	"status_id" bigint,
	"responsible_id" varchar(36),
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "events_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"category_id" bigint,
	"description" text,
	"amount" bigint,
	"result_id" bigint,
	"date" date,
	"created_by_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "expenses_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "failed_jobs" (
	"id" bigserial NOT NULL,
	"uuid" varchar(255) NOT NULL,
	"connection" text NOT NULL,
	"queue" text NOT NULL,
	"payload" text NOT NULL,
	"exception" text NOT NULL,
	"failed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "failed_jobs_id" PRIMARY KEY("id"),
	CONSTRAINT "failed_jobs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"path" varchar(255) NOT NULL,
	"disk" varchar(255) NOT NULL,
	"mime_type" varchar(255),
	"size" bigint,
	"folder_id" bigint,
	"user_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "files_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "files_links" (
	"id" bigserial NOT NULL,
	"area_id" bigint,
	"file_id" bigint NOT NULL,
	"fileable_type" varchar(255) NOT NULL,
	"fileable_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "files_links_id" PRIMARY KEY("id"),
	CONSTRAINT "files_links_unique" UNIQUE("file_id","fileable_id","fileable_type")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_id" bigint,
	"user_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "folders_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"type_id" bigint,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status_id" bigint,
	"approver_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "holidays_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"type_id" bigint,
	"category_id" bigint,
	"description" text,
	"amount" bigint,
	"result_id" bigint,
	"date" date,
	"created_by_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "incomes_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "inductions" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"type_bond_id" bigint,
	"entry_date" date NOT NULL,
	"responsible_id" varchar(36),
	"date" date,
	"status_id" bigint,
	"confirmation_id" bigint,
	"resource" varchar(255),
	"duration" time,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "inductions_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" bigserial NOT NULL,
	"applicant_id" bigint NOT NULL,
	"date" date NOT NULL,
	"time" time,
	"interviewer_id" varchar(36),
	"interview_type_id" bigint,
	"status_id" bigint,
	"result_id" bigint,
	"platform" varchar(255),
	"platform_url" varchar(255),
	"expected_results" text,
	"interviewer_observations" text,
	"rating" numeric(3, 1),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "interviews_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" bigserial NOT NULL,
	"invoice_date" date NOT NULL,
	"code" varchar(255) NOT NULL,
	"contact_id" bigint,
	"description" text,
	"created_by_id" varchar(36),
	"total" bigint,
	"method_payment" varchar(255),
	"status_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "invoices_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "job_batches" (
	"id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"total_jobs" integer NOT NULL,
	"pending_jobs" integer NOT NULL,
	"failed_jobs" integer NOT NULL,
	"failed_job_ids" text NOT NULL,
	"options" text,
	"cancelled_at" integer,
	"created_at" integer NOT NULL,
	"finished_at" integer,
	CONSTRAINT "job_batches_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" bigserial NOT NULL,
	"queue" varchar(255) NOT NULL,
	"payload" text NOT NULL,
	"attempts" smallint NOT NULL,
	"reserved_at" integer,
	"available_at" integer NOT NULL,
	"created_at" integer NOT NULL,
	CONSTRAINT "jobs_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "kits" (
	"id" bigserial NOT NULL,
	"requested_by_user_id" varchar(36),
	"position_area" varchar(255) NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"recipient_role" varchar(255) NOT NULL,
	"kit_type" varchar(255),
	"kit_contents" text,
	"request_date" date NOT NULL,
	"delivery_date" date,
	"status_id" bigint,
	"delivery_responsible_user_id" varchar(36),
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "kits_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "kpi_records" (
	"id" bigserial NOT NULL,
	"kpi_id" bigint NOT NULL,
	"record_date" date,
	"value" numeric(10, 2),
	"observation" text,
	"created_by_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "kpi_records_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" bigserial NOT NULL,
	"protocol_code" varchar(255),
	"indicator_name" varchar(255) NOT NULL,
	"periodicity_days" integer DEFAULT 30 NOT NULL,
	"target_value" numeric(10, 2),
	"role_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "kpis_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "license_status_updates" (
	"id" bigserial NOT NULL,
	"license_id" bigint NOT NULL,
	"date" date,
	"responsible_id" varchar(36),
	"status_id" bigint,
	"description" text,
	"internal_notes" text,
	"created_by" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "license_status_updates_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" bigserial NOT NULL,
	"project_id" bigint,
	"license_type_id" bigint,
	"status_id" bigint,
	"entity" varchar(255),
	"company" varchar(255),
	"eradicated_number" varchar(255),
	"eradicatd_date" date,
	"estimated_approval_date" date,
	"expiration_date" date,
	"requires_extension" boolean DEFAULT false NOT NULL,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "licenses_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "meeting_responsibles" (
	"id" bigserial NOT NULL,
	"meeting_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "meeting_responsibles_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" bigserial NOT NULL,
	"title" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"team_id" bigint,
	"status_id" bigint,
	"notes" text,
	"url" varchar(255),
	"observations" text,
	"goal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"bookingId" varchar(255),
	CONSTRAINT "meetings_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "message_mentions" (
	"id" bigserial NOT NULL,
	"message_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "message_mentions_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" bigserial NOT NULL,
	"message_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"emoji" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "message_reactions_id" PRIMARY KEY("id"),
	CONSTRAINT "message_reactions_message_id_user_id_unique" UNIQUE("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" bigserial NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"channel_id" bigint,
	"private_chat_id" bigint,
	"content" text,
	"type" varchar(255) DEFAULT 'text' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"parent_id" bigint,
	CONSTRAINT "messages_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "migrations" (
	"id" serial NOT NULL,
	"migration" varchar(255) NOT NULL,
	"batch" integer NOT NULL,
	CONSTRAINT "migrations_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "model_has_permissions" (
	"permission_id" bigint NOT NULL,
	"model_type" varchar(255) NOT NULL,
	"model_id" bigint NOT NULL,
	CONSTRAINT "model_has_permissions_permission_id_model_id_model_type" PRIMARY KEY("permission_id","model_id","model_type")
);
--> statement-breakpoint
CREATE TABLE "model_has_roles" (
	"role_id" bigint NOT NULL,
	"model_type" varchar(255) NOT NULL,
	"model_id" bigint NOT NULL,
	CONSTRAINT "model_has_roles_role_id_model_id_model_type" PRIMARY KEY("role_id","model_id","model_type")
);
--> statement-breakpoint
CREATE TABLE "norms" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "norms_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" bigserial NOT NULL,
	"type" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" json,
	"user_id" varchar(36) NOT NULL,
	"notifiable_type" varchar(255),
	"notifiable_id" bigint,
	"scheduled_at" timestamp,
	"recurring_pattern" json,
	"reminder_days" integer,
	"event_date" timestamp,
	"last_sent_at" timestamp,
	"next_send_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"send_email" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "notification_templates_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" bigserial NOT NULL,
	"template_id" bigint,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" json,
	"notifiable_type" varchar(255),
	"notifiable_id" bigint,
	"user_id" varchar(36) NOT NULL,
	"read_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "notifications_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "oauth_connections" (
	"id" bigserial NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"avatar" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "oauth_connections_id" PRIMARY KEY("id"),
	CONSTRAINT "oauth_connections_user_id_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "off_boarding_tasks" (
	"id" bigserial NOT NULL,
	"off_boarding_id" bigint NOT NULL,
	"content" text NOT NULL,
	"completed" smallint DEFAULT 0 NOT NULL,
	"team_id" bigint,
	"completed_by" varchar(36),
	"completed_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "off_boarding_tasks_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "off_boardings" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"project_id" bigint,
	"reason" text,
	"exit_date" date,
	"status_id" bigint,
	"responsible_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "off_boardings_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp,
	CONSTRAINT "password_reset_tokens_email" PRIMARY KEY("email")
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" bigserial NOT NULL,
	"employee_id" bigint,
	"subtotal" bigint NOT NULL,
	"bonos" bigint,
	"deductions" bigint,
	"total" bigint NOT NULL,
	"status_id" bigint,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "payrolls_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"guard_name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"area_id" bigint,
	"action" varchar(255) NOT NULL,
	CONSTRAINT "permissions_id" PRIMARY KEY("id"),
	CONSTRAINT "permissions_name_guard_name_area_id_unique" UNIQUE("name","guard_name","area_id")
);
--> statement-breakpoint
CREATE TABLE "personal_access_tokens" (
	"id" bigserial NOT NULL,
	"tokenable_type" varchar(255) NOT NULL,
	"tokenable_id" bigint NOT NULL,
	"name" text NOT NULL,
	"token" varchar(64) NOT NULL,
	"abilities" text,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "personal_access_tokens_id" PRIMARY KEY("id"),
	CONSTRAINT "personal_access_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" bigserial NOT NULL,
	"project_id" bigint,
	"team_id" bigint,
	"owner_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "plans_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type_id" bigint,
	"status_id" bigint,
	"issued_at" date,
	"reviewed_at" date,
	"assigned_to_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "policies_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "private_chat_user" (
	"id" bigserial NOT NULL,
	"private_chat_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "private_chat_user_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "private_chats" (
	"id" bigserial NOT NULL,
	"is_group" boolean DEFAULT false NOT NULL,
	"name" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "private_chats_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"direction" varchar(255),
	"contact_id" bigint,
	"status_id" bigint,
	"project_type_id" bigint,
	"current_stage_id" bigint,
	"responsible_id" varchar(36),
	"team_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "projects_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "punch_items" (
	"id" bigserial NOT NULL,
	"worksite_id" bigint NOT NULL,
	"status_id" bigint,
	"observations" text,
	"responsible_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "punch_items_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" bigserial NOT NULL,
	"contact_id" bigint,
	"issued_at" date,
	"status_id" bigint,
	"total" bigint,
	"user_id" varchar(36),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "quotes_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" bigserial NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status_id" bigint,
	"date" date,
	"hour" time,
	"user_id" varchar(36),
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "reports_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "role_has_permissions" (
	"permission_id" bigint NOT NULL,
	"role_id" bigint NOT NULL,
	CONSTRAINT "role_has_permissions_permission_id_role_id" PRIMARY KEY("permission_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"guard_name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "roles_id" PRIMARY KEY("id"),
	CONSTRAINT "roles_name_guard_name_unique" UNIQUE("name","guard_name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(36) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" varchar(255) NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar(36) NOT NULL,
	CONSTRAINT "sessions_id" PRIMARY KEY("id"),
	CONSTRAINT "token" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" bigserial NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"shared_with_user_id" varchar(36),
	"shared_with_team_id" bigint,
	"shareable_type" varchar(255) NOT NULL,
	"shareable_id" bigint NOT NULL,
	"permission" text DEFAULT 'view' NOT NULL,
	"share_token" varchar(255),
	"expires_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "shares_id" PRIMARY KEY("id"),
	CONSTRAINT "shares_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "social_media_posts" (
	"id" bigserial NOT NULL,
	"mediums" varchar(255),
	"content_type" varchar(255),
	"piece_name" varchar(255),
	"scheduled_date" date,
	"project_id" bigint,
	"responsible_id" varchar(36),
	"status_id" bigint,
	"comments" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "social_media_posts_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" bigserial NOT NULL,
	"project_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "stages_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"objective" varchar(255),
	"status_id" bigint,
	"start_date" date,
	"end_date" date,
	"target_audience" varchar(255),
	"platforms" varchar(255),
	"responsible_id" varchar(36),
	"notify_team" boolean DEFAULT false NOT NULL,
	"add_to_calendar" boolean DEFAULT false NOT NULL,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "strategies_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "subs" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"frequency_id" bigint,
	"type" varchar(255),
	"amount" bigint NOT NULL,
	"start_date" date,
	"renewal_date" date,
	"status_id" bigint,
	"user_id" varchar(36),
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "subs_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "tag_categories" (
	"id" bigserial NOT NULL,
	"slug" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "tag_categories_id" PRIMARY KEY("id"),
	CONSTRAINT "tag_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" bigserial NOT NULL,
	"category_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"color" varchar(255),
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "tags_id" PRIMARY KEY("id"),
	CONSTRAINT "tags_category_id_name_unique" UNIQUE("category_id","name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "task_user" (
	"id" bigserial NOT NULL,
	"task_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "task_user_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" bigserial NOT NULL,
	"bucket_id" bigint NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status_id" bigint,
	"priority_id" bigint,
	"created_by" varchar(36),
	"notes" varchar(255),
	"start_date" date,
	"due_date" date,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "tasks_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "tax_records" (
	"id" bigserial NOT NULL,
	"type_id" bigint,
	"status_id" bigint,
	"entity" varchar(255) NOT NULL,
	"base" bigint NOT NULL,
	"porcentage" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"date" date NOT NULL,
	"observations" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "tax_records_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "team_channels" (
	"id" bigserial NOT NULL,
	"team_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"parent_id" bigint,
	CONSTRAINT "team_channels_id" PRIMARY KEY("id"),
	CONSTRAINT "team_channels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_roles" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "team_roles_id" PRIMARY KEY("id"),
	CONSTRAINT "team_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "team_user" (
	"id" bigserial NOT NULL,
	"team_id" bigint NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"role_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "team_user_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" bigserial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"profile_photo_path" varchar(2048),
	"isPublic" boolean DEFAULT true NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "teams_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" varchar(36) NOT NULL,
	"role_id" bigint NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_id" PRIMARY KEY("id"),
	CONSTRAINT "email" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" bigserial NOT NULL,
	"title" varchar(255) NOT NULL,
	"area" varchar(255),
	"contract_type_id" bigint,
	"published_at" date,
	"status_id" bigint,
	"user_id" varchar(36),
	"description" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "vacancies_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" varchar(36) NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "verifications_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" bigserial NOT NULL,
	"worksite_id" bigint NOT NULL,
	"visit_date" date,
	"performed_by" varchar(36),
	"general_observations" text,
	"status_id" bigint,
	"internal_notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "visits_id" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" bigserial NOT NULL,
	"campaign_id" bigint,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(255),
	"address" varchar(255),
	"city" varchar(255),
	"state" varchar(255),
	"country" varchar(255),
	"role" varchar(255),
	"status_id" bigint,
	"certified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "volunteers_id" PRIMARY KEY("id"),
	CONSTRAINT "volunteers_email_unique" UNIQUE("email"),
	CONSTRAINT "volunteers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "worksites" (
	"id" bigserial NOT NULL,
	"project_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"type_id" bigint,
	"status_id" bigint,
	"responsible_id" varchar(36),
	"address" varchar(255),
	"start_date" date,
	"end_date" date,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "worksites_id" PRIMARY KEY("id")
);
--> statement-breakpoint
ALTER TABLE "adpieces" ADD CONSTRAINT "adpieces_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adpieces" ADD CONSTRAINT "adpieces_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adpieces" ADD CONSTRAINT "adpieces_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adpieces" ADD CONSTRAINT "adpieces_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adpieces" ADD CONSTRAINT "adpieces_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alliances" ADD CONSTRAINT "alliances_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_priority_id_tags_id_fk" FOREIGN KEY ("priority_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvers" ADD CONSTRAINT "approvers_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvers" ADD CONSTRAINT "approvers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvers" ADD CONSTRAINT "approvers_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apu_campaigns" ADD CONSTRAINT "apu_campaigns_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apu_campaigns" ADD CONSTRAINT "apu_campaigns_unit_id_tags_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_modality_id_tags_id_fk" FOREIGN KEY ("modality_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birthdays" ADD CONSTRAINT "birthdays_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birthdays" ADD CONSTRAINT "birthdays_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birthdays" ADD CONSTRAINT "birthdays_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buckets" ADD CONSTRAINT "buckets_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_marketings" ADD CONSTRAINT "case_marketings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_marketings" ADD CONSTRAINT "case_marketings_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_marketings" ADD CONSTRAINT "case_marketings_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_marketings" ADD CONSTRAINT "case_marketings_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_case_type_id_tags_id_fk" FOREIGN KEY ("case_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_records" ADD CONSTRAINT "case_records_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_change_type_id_tags_id_fk" FOREIGN KEY ("change_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_budget_impact_id_tags_id_fk" FOREIGN KEY ("budget_impact_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_user" ADD CONSTRAINT "channel_user_channel_id_team_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."team_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_user" ADD CONSTRAINT "channel_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_type_id_tags_id_fk" FOREIGN KEY ("contact_type_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_relation_type_id_tags_id_fk" FOREIGN KEY ("relation_type_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_source_id_tags_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_label_id_tags_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_category_id_tags_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_schedule_id_tags_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_registered_by_id_users_id_fk" FOREIGN KEY ("registered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_gender_id_tags_id_fk" FOREIGN KEY ("gender_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_education_type_id_tags_id_fk" FOREIGN KEY ("education_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_marital_status_id_tags_id_fk" FOREIGN KEY ("marital_status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_items" ADD CONSTRAINT "event_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_items" ADD CONSTRAINT "event_items_unit_id_tags_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_tags_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_result_id_tags_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files_links" ADD CONSTRAINT "files_links_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files_links" ADD CONSTRAINT "files_links_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_tags_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_result_id_tags_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inductions" ADD CONSTRAINT "inductions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inductions" ADD CONSTRAINT "inductions_type_bond_id_tags_id_fk" FOREIGN KEY ("type_bond_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inductions" ADD CONSTRAINT "inductions_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inductions" ADD CONSTRAINT "inductions_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inductions" ADD CONSTRAINT "inductions_confirmation_id_tags_id_fk" FOREIGN KEY ("confirmation_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interview_type_id_tags_id_fk" FOREIGN KEY ("interview_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_result_id_tags_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kits" ADD CONSTRAINT "kits_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kits" ADD CONSTRAINT "kits_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kits" ADD CONSTRAINT "kits_delivery_responsible_user_id_users_id_fk" FOREIGN KEY ("delivery_responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_records" ADD CONSTRAINT "kpi_records_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_records" ADD CONSTRAINT "kpi_records_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_status_updates" ADD CONSTRAINT "license_status_updates_license_id_licenses_id_fk" FOREIGN KEY ("license_id") REFERENCES "public"."licenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_status_updates" ADD CONSTRAINT "license_status_updates_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_status_updates" ADD CONSTRAINT "license_status_updates_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_status_updates" ADD CONSTRAINT "license_status_updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_license_type_id_tags_id_fk" FOREIGN KEY ("license_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_responsibles" ADD CONSTRAINT "meeting_responsibles_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_responsibles" ADD CONSTRAINT "meeting_responsibles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_channel_id_team_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."team_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_private_chat_id_private_chats_id_fk" FOREIGN KEY ("private_chat_id") REFERENCES "public"."private_chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_has_permissions" ADD CONSTRAINT "model_has_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_has_roles" ADD CONSTRAINT "model_has_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "norms" ADD CONSTRAINT "norms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boarding_tasks" ADD CONSTRAINT "off_boarding_tasks_off_boarding_id_off_boardings_id_fk" FOREIGN KEY ("off_boarding_id") REFERENCES "public"."off_boardings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boarding_tasks" ADD CONSTRAINT "off_boarding_tasks_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boarding_tasks" ADD CONSTRAINT "off_boarding_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boardings" ADD CONSTRAINT "off_boardings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boardings" ADD CONSTRAINT "off_boardings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boardings" ADD CONSTRAINT "off_boardings_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "off_boardings" ADD CONSTRAINT "off_boardings_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat_user" ADD CONSTRAINT "private_chat_user_private_chat_id_private_chats_id_fk" FOREIGN KEY ("private_chat_id") REFERENCES "public"."private_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private_chat_user" ADD CONSTRAINT "private_chat_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_type_id_tags_id_fk" FOREIGN KEY ("project_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_current_stage_id_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punch_items" ADD CONSTRAINT "punch_items_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punch_items" ADD CONSTRAINT "punch_items_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "punch_items" ADD CONSTRAINT "punch_items_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_shared_with_team_id_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_posts" ADD CONSTRAINT "social_media_posts_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subs" ADD CONSTRAINT "subs_frequency_id_tags_id_fk" FOREIGN KEY ("frequency_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subs" ADD CONSTRAINT "subs_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subs" ADD CONSTRAINT "subs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_tag_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tag_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_user" ADD CONSTRAINT "task_user_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_user" ADD CONSTRAINT "task_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_bucket_id_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."buckets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_priority_id_tags_id_fk" FOREIGN KEY ("priority_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channels" ADD CONSTRAINT "team_channels_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_channels" ADD CONSTRAINT "team_channels_parent_id_foreign" FOREIGN KEY ("parent_id") REFERENCES "public"."team_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_user" ADD CONSTRAINT "team_user_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_user" ADD CONSTRAINT "team_user_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_user" ADD CONSTRAINT "team_user_role_id_team_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."team_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_contract_type_id_tags_id_fk" FOREIGN KEY ("contract_type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_worksite_id_worksites_id_fk" FOREIGN KEY ("worksite_id") REFERENCES "public"."worksites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_type_id_tags_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_status_id_tags_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worksites" ADD CONSTRAINT "worksites_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "adpieces_format_id_foreign" ON "adpieces" USING btree ("format_id");--> statement-breakpoint
CREATE INDEX "files_links_fileable_type_fileable_id_index" ON "files_links" USING btree ("fileable_type","fileable_id");--> statement-breakpoint
CREATE INDEX "jobs_queue_index" ON "jobs" USING btree ("queue");--> statement-breakpoint
CREATE INDEX "model_has_permissions_model_id_model_type_index" ON "model_has_permissions" USING btree ("model_id","model_type");--> statement-breakpoint
CREATE INDEX "model_has_roles_model_id_model_type_index" ON "model_has_roles" USING btree ("model_id","model_type");--> statement-breakpoint
CREATE INDEX "notification_templates_notifiable_type_notifiable_id_index" ON "notification_templates" USING btree ("notifiable_type","notifiable_id");--> statement-breakpoint
CREATE INDEX "notification_templates_type_is_active_next_send_at_index" ON "notification_templates" USING btree ("type","is_active","next_send_at");--> statement-breakpoint
CREATE INDEX "notification_templates_user_id_is_active_index" ON "notification_templates" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "notifications_notifiable_type_notifiable_id_index" ON "notifications" USING btree ("notifiable_type","notifiable_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_index" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_id_status_index" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permissions_area_id_index" ON "permissions" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "personal_access_tokens_tokenable_type_tokenable_id_index" ON "personal_access_tokens" USING btree ("tokenable_type","tokenable_id");--> statement-breakpoint
CREATE INDEX "personal_access_tokens_expires_at_index" ON "personal_access_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shares_shareable_type_shareable_id_index" ON "shares" USING btree ("shareable_type","shareable_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_index" ON "user_roles" USING btree ("role_id");