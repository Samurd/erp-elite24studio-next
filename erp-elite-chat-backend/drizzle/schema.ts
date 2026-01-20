import { pgTable, serial, text, bigint, index, varchar, timestamp, integer, unique, bigserial, smallint, foreignKey, boolean, date, time, numeric, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const drizzleMigrations = pgTable("drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});

export const accounts = pgTable("accounts", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const cache = pgTable("cache", {
	key: varchar({ length: 255 }).primaryKey().notNull(),
	value: text().notNull(),
	expiration: integer().notNull(),
});

export const cacheLocks = pgTable("cache_locks", {
	key: varchar({ length: 255 }).primaryKey().notNull(),
	owner: varchar({ length: 255 }).notNull(),
	expiration: integer().notNull(),
});

export const failedJobs = pgTable("failed_jobs", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	uuid: varchar({ length: 255 }).notNull(),
	connection: text().notNull(),
	queue: text().notNull(),
	payload: text().notNull(),
	exception: text().notNull(),
	failedAt: timestamp("failed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("failed_jobs_uuid_unique").on(table.uuid),
]);

export const jobBatches = pgTable("job_batches", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	totalJobs: integer("total_jobs").notNull(),
	pendingJobs: integer("pending_jobs").notNull(),
	failedJobs: integer("failed_jobs").notNull(),
	failedJobIds: text("failed_job_ids").notNull(),
	options: text(),
	cancelledAt: integer("cancelled_at"),
	createdAt: integer("created_at").notNull(),
	finishedAt: integer("finished_at"),
});

export const jobs = pgTable("jobs", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	queue: varchar({ length: 255 }).notNull(),
	payload: text().notNull(),
	attempts: smallint().notNull(),
	reservedAt: integer("reserved_at"),
	availableAt: integer("available_at").notNull(),
	createdAt: integer("created_at").notNull(),
}, (table) => [
	index().using("btree", table.queue.asc().nullsLast().op("text_ops")),
]);

export const migrations = pgTable("migrations", {
	id: serial().primaryKey().notNull(),
	migration: varchar({ length: 255 }).notNull(),
	batch: integer().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
	email: varchar({ length: 255 }).primaryKey().notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
});

export const personalAccessTokens = pgTable("personal_access_tokens", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
	name: text().notNull(),
	token: varchar({ length: 64 }).notNull(),
	abilities: text(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index().using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index().using("btree", table.tokenableType.asc().nullsLast().op("int8_ops"), table.tokenableId.asc().nullsLast().op("int8_ops")),
	unique("personal_access_tokens_token_unique").on(table.token),
]);

export const sessions = pgTable("sessions", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: varchar("user_id", { length: 36 }).notNull(),
}, (table) => [
	index().using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("token").on(table.token),
]);

export const verifications = pgTable("verifications", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const tags = pgTable("tags", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	color: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [tagCategories.id],
			name: "tags_category_id_tag_categories_id_fk"
		}).onDelete("cascade"),
	unique("tags_category_id_name_unique").on(table.categoryId, table.name),
	unique("tags_slug_unique").on(table.slug),
]);

export const adpieces = pgTable("adpieces", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	formatId: bigint("format_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	strategyId: bigint("strategy_id", { mode: "number" }),
	name: varchar({ length: 255 }).notNull(),
	media: varchar({ length: 255 }),
	instructions: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("adpieces_format_id_foreign").using("btree", table.formatId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "adpieces_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "adpieces_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "adpieces_project_id_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "adpieces_team_id_teams_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.strategyId],
			foreignColumns: [strategies.id],
			name: "adpieces_strategy_id_strategies_id_fk"
		}).onDelete("set null"),
]);

export const projects = pgTable("projects", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	direction: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactId: bigint("contact_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectTypeId: bigint("project_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	currentStageId: bigint("current_stage_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "projects_contact_id_contacts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "projects_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.projectTypeId],
			foreignColumns: [tags.id],
			name: "projects_project_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.currentStageId],
			foreignColumns: [stages.id],
			name: "projects_current_stage_id_stages_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "projects_responsible_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "projects_team_id_teams_id_fk"
		}).onDelete("set null"),
]);

export const teams = pgTable("teams", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
	isPublic: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const strategies = pgTable("strategies", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	objective: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	targetAudience: varchar("target_audience", { length: 255 }),
	platforms: varchar({ length: 255 }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	notifyTeam: boolean("notify_team").default(false).notNull(),
	addToCalendar: boolean("add_to_calendar").default(false).notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "strategies_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "strategies_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const alliances = pgTable("alliances", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	startDate: date("start_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	validity: bigint({ mode: "number" }),
	certified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "alliances_type_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const vacancies = pgTable("vacancies", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	area: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contractTypeId: bigint("contract_type_id", { mode: "number" }),
	publishedAt: date("published_at"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contractTypeId],
			foreignColumns: [tags.id],
			name: "vacancies_contract_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "vacancies_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "vacancies_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const applicants = pgTable("applicants", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	vacancyId: bigint("vacancy_id", { mode: "number" }).notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.vacancyId],
			foreignColumns: [vacancies.id],
			name: "applicants_vacancy_id_vacancies_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "applicants_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const approvals = pgTable("approvals", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	allApprovers: boolean("all_approvers").default(false).notNull(),
	buy: boolean().default(false).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	priorityId: bigint("priority_id", { mode: "number" }),
	createdById: varchar("created_by_id", { length: 36 }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "approvals_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.priorityId],
			foreignColumns: [tags.id],
			name: "approvals_priority_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "approvals_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).primaryKey().notNull(),
	name: text().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("email").on(table.email),
]);

export const approvers = pgTable("approvers", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	approvalId: bigint("approval_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	order: integer(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	comment: text(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.approvalId],
			foreignColumns: [approvals.id],
			name: "approvers_approval_id_approvals_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "approvers_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "approvers_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const campaigns = pgTable("campaigns", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	dateEvent: date("date_event"),
	address: varchar({ length: 255 }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	alliances: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	goal: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	estimatedBudget: bigint("estimated_budget", { mode: "number" }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "campaigns_responsible_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "campaigns_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const apuCampaigns = pgTable("apu_campaigns", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	campaignId: bigint("campaign_id", { mode: "number" }),
	description: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unitId: bigint("unit_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unitPrice: bigint("unit_price", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPrice: bigint("total_price", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "apu_campaigns_campaign_id_campaigns_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [tags.id],
			name: "apu_campaigns_unit_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const areas = pgTable("areas", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	slug: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "areas_parent_id_foreign"
		}).onDelete("set null"),
	unique("areas_slug_unique").on(table.slug),
]);

export const employees = pgTable("employees", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	jobTitle: varchar("job_title", { length: 255 }).notNull(),
	workEmail: varchar("work_email", { length: 255 }).notNull(),
	mobilePhone: varchar("mobile_phone", { length: 255 }).notNull(),
	curriculumFile: varchar("curriculum_file", { length: 255 }),
	workAddress: text("work_address").notNull(),
	workSchedule: varchar("work_schedule", { length: 255 }).default('40 hours/week').notNull(),
	homeAddress: text("home_address"),
	personalEmail: varchar("personal_email", { length: 255 }),
	privatePhone: varchar("private_phone", { length: 255 }),
	bankAccount: varchar("bank_account", { length: 255 }),
	bankCertificateFile: varchar("bank_certificate_file", { length: 255 }),
	identificationNumber: varchar("identification_number", { length: 255 }).notNull(),
	socialSecurityNumber: varchar("social_security_number", { length: 255 }),
	passportNumber: varchar("passport_number", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	genderId: bigint("gender_id", { mode: "number" }),
	birthDate: date("birth_date"),
	birthPlace: varchar("birth_place", { length: 255 }),
	birthCountry: varchar("birth_country", { length: 255 }),
	hasDisability: boolean("has_disability").default(false).notNull(),
	disabilityDetails: text("disability_details"),
	emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	educationTypeId: bigint("education_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	maritalStatusId: bigint("marital_status_id", { mode: "number" }),
	numberOfDependents: integer("number_of_dependents").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	departmentId: bigint("department_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.genderId],
			foreignColumns: [tags.id],
			name: "employees_gender_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.educationTypeId],
			foreignColumns: [tags.id],
			name: "employees_education_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.maritalStatusId],
			foreignColumns: [tags.id],
			name: "employees_marital_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.departmentId],
			foreignColumns: [departments.id],
			name: "employees_department_id_departments_id_fk"
		}).onDelete("set null"),
	unique("employees_work_email_unique").on(table.workEmail),
	unique("employees_identification_number_unique").on(table.identificationNumber),
]);

export const attendances = pgTable("attendances", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }).notNull(),
	date: date().notNull(),
	checkIn: time("check_in").notNull(),
	checkOut: time("check_out").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	modalityId: bigint("modality_id", { mode: "number" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "attendances_employee_id_employees_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "attendances_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.modalityId],
			foreignColumns: [tags.id],
			name: "attendances_modality_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const audits = pgTable("audits", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	dateRegister: date("date_register").notNull(),
	dateAudit: date("date_audit").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	objective: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	place: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "audits_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "audits_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const birthdays = pgTable("birthdays", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactId: bigint("contact_id", { mode: "number" }),
	date: date().notNull(),
	whatsapp: varchar({ length: 255 }),
	comments: text(),
	responsibleId: varchar("responsible_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "birthdays_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "birthdays_contact_id_contacts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "birthdays_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const contacts = pgTable("contacts", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 150 }).notNull(),
	company: varchar({ length: 150 }),
	emailPersonal: varchar("email_personal", { length: 255 }),
	emailCorporativo: varchar("email_corporativo", { length: 255 }),
	phone: varchar({ length: 50 }),
	address: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	firstContactDate: date("first_contact_date"),
	notes: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactTypeId: bigint("contact_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	relationTypeId: bigint("relation_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sourceId: bigint("source_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	labelId: bigint("label_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactTypeId],
			foreignColumns: [tags.id],
			name: "contacts_contact_type_id_tags_id_fk"
		}),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "contacts_status_id_tags_id_fk"
		}),
	foreignKey({
			columns: [table.relationTypeId],
			foreignColumns: [tags.id],
			name: "contacts_relation_type_id_tags_id_fk"
		}),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [tags.id],
			name: "contacts_source_id_tags_id_fk"
		}),
	foreignKey({
			columns: [table.labelId],
			foreignColumns: [tags.id],
			name: "contacts_label_id_tags_id_fk"
		}),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "contacts_responsible_id_users_id_fk"
		}),
]);

export const plans = pgTable("plans", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }),
	ownerId: varchar("owner_id", { length: 36 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "plans_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "plans_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "plans_owner_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const buckets = pgTable("buckets", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	planId: bigint("plan_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	order: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.id],
			name: "buckets_plan_id_plans_id_fk"
		}).onDelete("cascade"),
]);

export const calendarEvents = pgTable("calendar_events", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	isAllDay: boolean("is_all_day").default(false).notNull(),
	color: varchar({ length: 255 }).default('#3b82f6').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "calendar_events_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const caseMarketings = pgTable("case_marketings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	subject: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	date: date(),
	mediums: varchar({ length: 255 }),
	description: text(),
	responsibleId: varchar("responsible_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "case_marketings_project_id_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "case_marketings_responsible_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "case_marketings_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "case_marketings_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const caseRecords = pgTable("case_records", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	date: date(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactId: bigint("contact_id", { mode: "number" }).notNull(),
	channel: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	caseTypeId: bigint("case_type_id", { mode: "number" }),
	assignedToId: varchar("assigned_to_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "case_records_contact_id_contacts_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "case_records_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.caseTypeId],
			foreignColumns: [tags.id],
			name: "case_records_case_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "case_records_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const certificates = pgTable("certificates", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	issuedAt: date("issued_at"),
	expiresAt: date("expires_at"),
	assignedToId: varchar("assigned_to_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "certificates_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "certificates_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "certificates_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const worksites = pgTable("worksites", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	address: varchar({ length: 255 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "worksites_project_id_projects_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "worksites_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "worksites_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "worksites_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const changes = pgTable("changes", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull(),
	changeDate: date("change_date").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	changeTypeId: bigint("change_type_id", { mode: "number" }),
	requestedBy: varchar("requested_by", { length: 255 }),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	budgetImpactId: bigint("budget_impact_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	approvedBy: varchar("approved_by", { length: 36 }),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.worksiteId],
			foreignColumns: [worksites.id],
			name: "changes_worksite_id_worksites_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.changeTypeId],
			foreignColumns: [tags.id],
			name: "changes_change_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.budgetImpactId],
			foreignColumns: [tags.id],
			name: "changes_budget_impact_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "changes_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "changes_approved_by_users_id_fk"
		}).onDelete("set null"),
]);

export const teamChannels = pgTable("team_channels", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	isPrivate: boolean("is_private").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_channels_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "team_channels_parent_id_foreign"
		}).onDelete("cascade"),
	unique("team_channels_slug_unique").on(table.slug),
]);

export const channelUser = pgTable("channel_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	channelId: bigint("channel_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [teamChannels.id],
			name: "channel_user_channel_id_team_channels_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "channel_user_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const contracts = pgTable("contracts", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	scheduleId: bigint("schedule_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }),
	registeredById: varchar("registered_by_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "contracts_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "contracts_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [tags.id],
			name: "contracts_category_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "contracts_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.scheduleId],
			foreignColumns: [tags.id],
			name: "contracts_schedule_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.registeredById],
			foreignColumns: [users.id],
			name: "contracts_registered_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const departments = pgTable("departments", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "departments_parent_id_foreign"
		}).onDelete("set null"),
]);

export const donations = pgTable("donations", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	campaignId: bigint("campaign_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).default(0).notNull(),
	paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
	date: date().notNull(),
	certified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "donations_campaign_id_campaigns_id_fk"
		}).onDelete("set null"),
]);

export const events = pgTable("events", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	eventDate: date("event_date").notNull(),
	location: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "events_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "events_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "events_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const eventItems = pgTable("event_items", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	eventId: bigint("event_id", { mode: "number" }).notNull(),
	description: varchar({ length: 255 }).notNull(),
	quantity: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unitId: bigint("unit_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalPrice: bigint("total_price", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "event_items_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.unitId],
			foreignColumns: [tags.id],
			name: "event_items_unit_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const expenses = pgTable("expenses", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	resultId: bigint("result_id", { mode: "number" }),
	date: date(),
	createdById: varchar("created_by_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [tags.id],
			name: "expenses_category_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [tags.id],
			name: "expenses_result_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "expenses_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const folders = pgTable("folders", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "folders_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "folders_parent_id_foreign"
		}).onDelete("cascade"),
]);

export const files = pgTable("files", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	path: varchar({ length: 255 }).notNull(),
	disk: varchar({ length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	size: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	folderId: bigint("folder_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [folders.id],
			name: "files_folder_id_folders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "files_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const filesLinks = pgTable("files_links", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	areaId: bigint("area_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileId: bigint("file_id", { mode: "number" }).notNull(),
	fileableType: varchar("fileable_type", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileableId: bigint("fileable_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index().using("btree", table.fileableType.asc().nullsLast().op("int8_ops"), table.fileableId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.areaId],
			foreignColumns: [areas.id],
			name: "files_links_area_id_areas_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "files_links_file_id_files_id_fk"
		}).onDelete("cascade"),
	unique("files_links_unique").on(table.fileId, table.fileableType, table.fileableId),
]);

export const holidays = pgTable("holidays", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	approverId: varchar("approver_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "holidays_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "holidays_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "holidays_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.approverId],
			foreignColumns: [users.id],
			name: "holidays_approver_id_users_id_fk"
		}).onDelete("set null"),
]);

export const incomes = pgTable("incomes", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	resultId: bigint("result_id", { mode: "number" }),
	date: date(),
	createdById: varchar("created_by_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "incomes_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [tags.id],
			name: "incomes_category_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [tags.id],
			name: "incomes_result_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "incomes_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const inductions = pgTable("inductions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeBondId: bigint("type_bond_id", { mode: "number" }),
	entryDate: date("entry_date").notNull(),
	responsibleId: varchar("responsible_id", { length: 36 }),
	date: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	confirmationId: bigint("confirmation_id", { mode: "number" }),
	resource: varchar({ length: 255 }),
	duration: time(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "inductions_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.typeBondId],
			foreignColumns: [tags.id],
			name: "inductions_type_bond_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "inductions_responsible_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "inductions_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.confirmationId],
			foreignColumns: [tags.id],
			name: "inductions_confirmation_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const interviews = pgTable("interviews", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	applicantId: bigint("applicant_id", { mode: "number" }).notNull(),
	date: date().notNull(),
	time: time(),
	interviewerId: varchar("interviewer_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	interviewTypeId: bigint("interview_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	resultId: bigint("result_id", { mode: "number" }),
	platform: varchar({ length: 255 }),
	platformUrl: varchar("platform_url", { length: 255 }),
	expectedResults: text("expected_results"),
	interviewerObservations: text("interviewer_observations"),
	rating: numeric({ precision: 3, scale:  1 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.applicantId],
			foreignColumns: [applicants.id],
			name: "interviews_applicant_id_applicants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.interviewerId],
			foreignColumns: [users.id],
			name: "interviews_interviewer_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.interviewTypeId],
			foreignColumns: [tags.id],
			name: "interviews_interview_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "interviews_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.resultId],
			foreignColumns: [tags.id],
			name: "interviews_result_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const invoices = pgTable("invoices", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	invoiceDate: date("invoice_date").notNull(),
	code: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactId: bigint("contact_id", { mode: "number" }),
	description: text(),
	createdById: varchar("created_by_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint({ mode: "number" }),
	methodPayment: varchar("method_payment", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "invoices_contact_id_contacts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "invoices_created_by_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "invoices_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const kits = pgTable("kits", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	requestedByUserId: varchar("requested_by_user_id", { length: 36 }),
	positionArea: varchar("position_area", { length: 255 }).notNull(),
	recipientName: varchar("recipient_name", { length: 255 }).notNull(),
	recipientRole: varchar("recipient_role", { length: 255 }).notNull(),
	kitType: varchar("kit_type", { length: 255 }),
	kitContents: text("kit_contents"),
	requestDate: date("request_date").notNull(),
	deliveryDate: date("delivery_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	deliveryResponsibleUserId: varchar("delivery_responsible_user_id", { length: 36 }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.requestedByUserId],
			foreignColumns: [users.id],
			name: "kits_requested_by_user_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "kits_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.deliveryResponsibleUserId],
			foreignColumns: [users.id],
			name: "kits_delivery_responsible_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const kpis = pgTable("kpis", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	protocolCode: varchar("protocol_code", { length: 255 }),
	indicatorName: varchar("indicator_name", { length: 255 }).notNull(),
	periodicityDays: integer("periodicity_days").default(30).notNull(),
	targetValue: numeric("target_value", { precision: 10, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "kpis_role_id_roles_id_fk"
		}).onDelete("set null"),
]);

export const kpiRecords = pgTable("kpi_records", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	kpiId: bigint("kpi_id", { mode: "number" }).notNull(),
	recordDate: date("record_date"),
	value: numeric({ precision: 10, scale:  2 }),
	observation: text(),
	createdById: varchar("created_by_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.kpiId],
			foreignColumns: [kpis.id],
			name: "kpi_records_kpi_id_kpis_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.createdById],
			foreignColumns: [users.id],
			name: "kpi_records_created_by_id_users_id_fk"
		}).onDelete("set null"),
]);

export const roles = pgTable("roles", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	unique("roles_name_guard_name_unique").on(table.name, table.guardName),
]);

export const licenses = pgTable("licenses", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	licenseTypeId: bigint("license_type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	entity: varchar({ length: 255 }),
	company: varchar({ length: 255 }),
	eradicatedNumber: varchar("eradicated_number", { length: 255 }),
	eradicatdDate: date("eradicatd_date"),
	estimatedApprovalDate: date("estimated_approval_date"),
	expirationDate: date("expiration_date"),
	requiresExtension: boolean("requires_extension").default(false).notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "licenses_project_id_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.licenseTypeId],
			foreignColumns: [tags.id],
			name: "licenses_license_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "licenses_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const licenseStatusUpdates = pgTable("license_status_updates", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	licenseId: bigint("license_id", { mode: "number" }).notNull(),
	date: date(),
	responsibleId: varchar("responsible_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	description: text(),
	internalNotes: text("internal_notes"),
	createdBy: varchar("created_by", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.licenseId],
			foreignColumns: [licenses.id],
			name: "license_status_updates_license_id_licenses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "license_status_updates_responsible_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "license_status_updates_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "license_status_updates_created_by_users_id_fk"
		}),
]);

export const meetings = pgTable("meetings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	date: date().notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	notes: text(),
	url: varchar({ length: 255 }),
	observations: text(),
	goal: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	bookingId: varchar({ length: 255 }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "meetings_team_id_teams_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "meetings_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const meetingResponsibles = pgTable("meeting_responsibles", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	meetingId: bigint("meeting_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.meetingId],
			foreignColumns: [meetings.id],
			name: "meeting_responsibles_meeting_id_meetings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "meeting_responsibles_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	channelId: bigint("channel_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	privateChatId: bigint("private_chat_id", { mode: "number" }),
	content: text(),
	type: varchar({ length: 255 }).default('text').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parentId: bigint("parent_id", { mode: "number" }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "messages_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.channelId],
			foreignColumns: [teamChannels.id],
			name: "messages_channel_id_team_channels_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.privateChatId],
			foreignColumns: [privateChats.id],
			name: "messages_private_chat_id_private_chats_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "messages_parent_id_foreign"
		}).onDelete("cascade"),
]);

export const messageMentions = pgTable("message_mentions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	messageId: bigint("message_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_mentions_message_id_messages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_mentions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const messageReactions = pgTable("message_reactions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	messageId: bigint("message_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	emoji: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_reactions_message_id_messages_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_reactions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("message_reactions_message_id_user_id_unique").on(table.messageId, table.userId),
]);

export const privateChats = pgTable("private_chats", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	isGroup: boolean("is_group").default(false).notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const permissions = pgTable("permissions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	areaId: bigint("area_id", { mode: "number" }),
	action: varchar({ length: 255 }).notNull(),
}, (table) => [
	index().using("btree", table.areaId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.areaId],
			foreignColumns: [areas.id],
			name: "permissions_area_id_areas_id_fk"
		}).onDelete("cascade"),
	unique("permissions_name_guard_name_area_id_unique").on(table.name, table.guardName, table.areaId),
]);

export const norms = pgTable("norms", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	userId: varchar("user_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "norms_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const notificationTemplates = pgTable("notification_templates", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	type: text().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	data: json(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	notifiableType: varchar("notifiable_type", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	notifiableId: bigint("notifiable_id", { mode: "number" }),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	recurringPattern: json("recurring_pattern"),
	reminderDays: integer("reminder_days"),
	eventDate: timestamp("event_date", { mode: 'string' }),
	lastSentAt: timestamp("last_sent_at", { mode: 'string' }),
	nextSendAt: timestamp("next_send_at", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	sendEmail: boolean("send_email").default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index().using("btree", table.notifiableType.asc().nullsLast().op("int8_ops"), table.notifiableId.asc().nullsLast().op("int8_ops")),
	index().using("btree", table.type.asc().nullsLast().op("bool_ops"), table.isActive.asc().nullsLast().op("timestamp_ops"), table.nextSendAt.asc().nullsLast().op("text_ops")),
	index().using("btree", table.userId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notification_templates_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	templateId: bigint("template_id", { mode: "number" }),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	data: json(),
	notifiableType: varchar("notifiable_type", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	notifiableId: bigint("notifiable_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }).notNull(),
	readAt: timestamp("read_at", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index().using("btree", table.notifiableType.asc().nullsLast().op("int8_ops"), table.notifiableId.asc().nullsLast().op("int8_ops")),
	index().using("btree", table.userId.asc().nullsLast().op("text_ops"), table.readAt.asc().nullsLast().op("timestamp_ops")),
	index("notifications_user_id_status_index").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [notificationTemplates.id],
			name: "notifications_template_id_notification_templates_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const oauthConnections = pgTable("oauth_connections", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	provider: varchar({ length: 255 }).notNull(),
	providerId: varchar("provider_id", { length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	avatar: varchar({ length: 255 }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "oauth_connections_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("oauth_connections_user_id_provider_unique").on(table.userId, table.provider),
]);

export const offBoardings = pgTable("off_boardings", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	reason: text(),
	exitDate: date("exit_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "off_boardings_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "off_boardings_project_id_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "off_boardings_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "off_boardings_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const offBoardingTasks = pgTable("off_boarding_tasks", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	offBoardingId: bigint("off_boarding_id", { mode: "number" }).notNull(),
	content: text().notNull(),
	completed: smallint().default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }),
	completedBy: varchar("completed_by", { length: 36 }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.offBoardingId],
			foreignColumns: [offBoardings.id],
			name: "off_boarding_tasks_off_boarding_id_off_boardings_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "off_boarding_tasks_team_id_teams_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.completedBy],
			foreignColumns: [users.id],
			name: "off_boarding_tasks_completed_by_users_id_fk"
		}),
]);

export const payrolls = pgTable("payrolls", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	employeeId: bigint("employee_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subtotal: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bonos: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deductions: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.employeeId],
			foreignColumns: [employees.id],
			name: "payrolls_employee_id_employees_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "payrolls_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const policies = pgTable("policies", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	issuedAt: date("issued_at"),
	reviewedAt: date("reviewed_at"),
	assignedToId: varchar("assigned_to_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "policies_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "policies_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.assignedToId],
			foreignColumns: [users.id],
			name: "policies_assigned_to_id_users_id_fk"
		}).onDelete("set null"),
]);

export const privateChatUser = pgTable("private_chat_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	privateChatId: bigint("private_chat_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.privateChatId],
			foreignColumns: [privateChats.id],
			name: "private_chat_user_private_chat_id_private_chats_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "private_chat_user_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const stages = pgTable("stages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const punchItems = pgTable("punch_items", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	observations: text(),
	responsibleId: varchar("responsible_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.worksiteId],
			foreignColumns: [worksites.id],
			name: "punch_items_worksite_id_worksites_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "punch_items_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "punch_items_responsible_id_users_id_fk"
		}).onDelete("set null"),
]);

export const quotes = pgTable("quotes", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	contactId: bigint("contact_id", { mode: "number" }),
	issuedAt: date("issued_at"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total: bigint({ mode: "number" }),
	userId: varchar("user_id", { length: 36 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: "quotes_contact_id_contacts_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "quotes_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quotes_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const reports = pgTable("reports", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	date: date(),
	hour: time(),
	userId: varchar("user_id", { length: 36 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "reports_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reports_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const shares = pgTable("shares", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	sharedWithUserId: varchar("shared_with_user_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sharedWithTeamId: bigint("shared_with_team_id", { mode: "number" }),
	shareableType: varchar("shareable_type", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shareableId: bigint("shareable_id", { mode: "number" }).notNull(),
	permission: text().default('view').notNull(),
	shareToken: varchar("share_token", { length: 255 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index().using("btree", table.shareableType.asc().nullsLast().op("int8_ops"), table.shareableId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "shares_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sharedWithUserId],
			foreignColumns: [users.id],
			name: "shares_shared_with_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sharedWithTeamId],
			foreignColumns: [teams.id],
			name: "shares_shared_with_team_id_teams_id_fk"
		}).onDelete("cascade"),
	unique("shares_share_token_unique").on(table.shareToken),
]);

export const socialMediaPosts = pgTable("social_media_posts", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	mediums: varchar({ length: 255 }),
	contentType: varchar("content_type", { length: 255 }),
	pieceName: varchar("piece_name", { length: 255 }),
	scheduledDate: date("scheduled_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	projectId: bigint("project_id", { mode: "number" }),
	responsibleId: varchar("responsible_id", { length: 36 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	comments: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "social_media_posts_project_id_projects_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.responsibleId],
			foreignColumns: [users.id],
			name: "social_media_posts_responsible_id_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "social_media_posts_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const subs = pgTable("subs", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	frequencyId: bigint("frequency_id", { mode: "number" }),
	type: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	startDate: date("start_date"),
	renewalDate: date("renewal_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.frequencyId],
			foreignColumns: [tags.id],
			name: "subs_frequency_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "subs_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const tagCategories = pgTable("tag_categories", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	slug: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	unique("tag_categories_slug_unique").on(table.slug),
]);

export const tasks = pgTable("tasks", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bucketId: bigint("bucket_id", { mode: "number" }).notNull(),
	order: integer().default(1).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	priorityId: bigint("priority_id", { mode: "number" }),
	createdBy: varchar("created_by", { length: 36 }),
	notes: varchar({ length: 255 }),
	startDate: date("start_date"),
	dueDate: date("due_date"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.bucketId],
			foreignColumns: [buckets.id],
			name: "tasks_bucket_id_buckets_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "tasks_status_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.priorityId],
			foreignColumns: [tags.id],
			name: "tasks_priority_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "tasks_created_by_users_id_fk"
		}).onDelete("set null"),
]);

export const taskUser = pgTable("task_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	taskId: bigint("task_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_user_task_id_tasks_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_user_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const taxRecords = pgTable("tax_records", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	typeId: bigint("type_id", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	entity: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	base: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	porcentage: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	amount: bigint({ mode: "number" }).notNull(),
	date: date().notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.typeId],
			foreignColumns: [tags.id],
			name: "tax_records_type_id_tags_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "tax_records_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const teamUser = pgTable("team_user", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	teamId: bigint("team_id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_user_team_id_teams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "team_user_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [teamRoles.id],
			name: "team_user_role_id_team_roles_id_fk"
		}).onDelete("cascade"),
]);

export const teamRoles = pgTable("team_roles", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	unique("team_roles_slug_unique").on(table.slug),
]);

export const visits = pgTable("visits", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull(),
	visitDate: date("visit_date"),
	performedBy: varchar("performed_by", { length: 36 }),
	generalObservations: text("general_observations"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.worksiteId],
			foreignColumns: [worksites.id],
			name: "visits_worksite_id_worksites_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.performedBy],
			foreignColumns: [users.id],
			name: "visits_performed_by_users_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "visits_status_id_tags_id_fk"
		}).onDelete("set null"),
]);

export const volunteers = pgTable("volunteers", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	campaignId: bigint("campaign_id", { mode: "number" }),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	address: varchar({ length: 255 }),
	city: varchar({ length: 255 }),
	state: varchar({ length: 255 }),
	country: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	statusId: bigint("status_id", { mode: "number" }),
	certified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.campaignId],
			foreignColumns: [campaigns.id],
			name: "volunteers_campaign_id_campaigns_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.statusId],
			foreignColumns: [tags.id],
			name: "volunteers_status_id_tags_id_fk"
		}).onDelete("set null"),
	unique("volunteers_email_unique").on(table.email),
	unique("volunteers_phone_unique").on(table.phone),
]);

export const roleHasPermissions = pgTable("role_has_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	permissionId: bigint("permission_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_has_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_has_permissions_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.permissionId, table.roleId], name: "role_has_permissions_permission_id_role_id"}),
]);

export const userRoles = pgTable("user_roles", {
	userId: varchar("user_id", { length: 36 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }).notNull(),
}, (table) => [
	index().using("btree", table.roleId.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_user_id_role_id"}),
]);

export const modelHasPermissions = pgTable("model_has_permissions", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	permissionId: bigint("permission_id", { mode: "number" }).notNull(),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	modelId: bigint("model_id", { mode: "number" }).notNull(),
}, (table) => [
	index().using("btree", table.modelId.asc().nullsLast().op("int8_ops"), table.modelType.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "model_has_permissions_permission_id_permissions_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.permissionId, table.modelType, table.modelId], name: "model_has_permissions_permission_id_model_id_model_type"}),
]);

export const modelHasRoles = pgTable("model_has_roles", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }).notNull(),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	modelId: bigint("model_id", { mode: "number" }).notNull(),
}, (table) => [
	index().using("btree", table.modelId.asc().nullsLast().op("int8_ops"), table.modelType.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "model_has_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.roleId, table.modelType, table.modelId], name: "model_has_roles_role_id_model_id_model_type"}),
]);
