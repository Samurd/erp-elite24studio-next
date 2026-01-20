import { AnyPgColumn, bigint, bigserial, boolean, date, decimal, foreignKey, index, integer, json, pgSchema, pgTable, primaryKey, serial, smallint, text, time, timestamp, unique, varchar } from "drizzle-orm/pg-core"
// import { sql } from "drizzle-orm"

export const adpieces = pgTable("adpieces", {
	id: bigserial("id", { mode: "number" }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	formatId: bigint("format_id", { mode: "number" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
	teamId: bigint("team_id", { mode: "number" }).references(() => teams.id, { onDelete: "set null" }),
	strategyId: bigint("strategy_id", { mode: "number" }).references(() => strategies.id, { onDelete: "set null" }),
	name: varchar({ length: 255 }).notNull(),
	media: varchar({ length: 255 }),
	instructions: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		index("adpieces_format_id_foreign").on(table.formatId),
		primaryKey({ columns: [table.id], name: "adpieces_id" }),
	]);

export const alliances = pgTable("alliances", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	validity: bigint({ mode: "number" }),
	certified: boolean("certified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "alliances_id" }),
	]);

export const applicants = pgTable("applicants", {
	id: bigserial("id", { mode: "number" }).notNull(),
	vacancyId: bigint("vacancy_id", { mode: "number" }).notNull().references(() => vacancies.id, { onDelete: "cascade" }),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "applicants_id" }),
	]);

export const approvals = pgTable("approvals", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	allApprovers: boolean("all_approvers").default(false).notNull(),
	buy: boolean("buy").default(false).notNull(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	priorityId: bigint("priority_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	createdById: varchar("created_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "approvals_id" }),
	]);

export const approvers = pgTable("approvers", {
	id: bigserial("id", { mode: "number" }).notNull(),
	approvalId: bigint("approval_id", { mode: "number" }).notNull().references(() => approvals.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	order: integer("order"),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	comment: text(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "approvers_id" }),
	]);

export const apuCampaigns = pgTable("apu_campaigns", {
	id: bigserial("id", { mode: "number" }).notNull(),
	campaignId: bigint("campaign_id", { mode: "number" }).references(() => campaigns.id, { onDelete: "set null" }),
	description: text().notNull(),
	quantity: bigint({ mode: "number" }).notNull(),
	unitId: bigint("unit_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	unitPrice: bigint("unit_price", { mode: "number" }),
	totalPrice: bigint("total_price", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "apu_campaigns_id" }),
	]);

export const areas = pgTable("areas", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	slug: varchar({ length: 255 }).notNull(),
	parentId: bigint("parent_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "areas_parent_id_foreign"
		}).onDelete("set null"),
		primaryKey({ columns: [table.id], name: "areas_id" }),
		unique("areas_slug_unique").on(table.slug),
	]);

export const attendances = pgTable("attendances", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).notNull().references(() => employees.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	checkIn: time("check_in").notNull(),
	checkOut: time("check_out").notNull(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	modalityId: bigint("modality_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "attendances_id" }),
	]);

export const audits = pgTable("audits", {
	id: bigserial("id", { mode: "number" }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateRegister: date("date_register", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateAudit: date("date_audit", { mode: 'string' }).notNull(),
	objective: bigint({ mode: "number" }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	place: varchar({ length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "audits_id" }),
	]);

export const birthdays = pgTable("birthdays", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	contactId: bigint("contact_id", { mode: "number" }).references(() => contacts.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	whatsapp: varchar({ length: 255 }),
	comments: text(),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "birthdays_id" }),
	]);

export const buckets = pgTable("buckets", {
	id: bigserial("id", { mode: "number" }).notNull(),
	planId: bigint("plan_id", { mode: "number" }).notNull().references(() => plans.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	order: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "buckets_id" }),
	]);

export const cache = pgTable("cache", {
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	expiration: integer().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.key], name: "cache_key" }),
	]);

export const cacheLocks = pgTable("cache_locks", {
	key: varchar({ length: 255 }).notNull(),
	owner: varchar({ length: 255 }).notNull(),
	expiration: integer().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.key], name: "cache_locks_key" }),
	]);

export const calendarEvents = pgTable("calendar_events", {
	id: bigserial("id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	isAllDay: boolean("is_all_day").default(false).notNull(),
	color: varchar({ length: 255 }).default('#3b82f6').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "calendar_events_id" }),
	]);

export const campaigns = pgTable("campaigns", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateEvent: date("date_event", { mode: 'string' }),
	address: varchar({ length: 255 }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	alliances: text(),
	goal: bigint({ mode: "number" }),
	estimatedBudget: bigint("estimated_budget", { mode: "number" }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "campaigns_id" }),
	]);

export const caseMarketings = pgTable("case_marketings", {
	id: bigserial("id", { mode: "number" }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	mediums: varchar({ length: 255 }),
	description: text(),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "case_marketings_id" }),
	]);

export const caseRecords = pgTable("case_records", {
	id: bigserial("id", { mode: "number" }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	description: text(),
	contactId: bigint("contact_id", { mode: "number" }).notNull().references(() => contacts.id, { onDelete: "cascade" }),
	channel: text(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	caseTypeId: bigint("case_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	assignedToId: varchar("assigned_to_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "case_records_id" }),
	]);

export const certificates = pgTable("certificates", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	issuedAt: date("issued_at", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expiresAt: date("expires_at", { mode: 'string' }),
	assignedToId: varchar("assigned_to_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "certificates_id" }),
	]);

export const changes = pgTable("changes", {
	id: bigserial("id", { mode: "number" }).notNull(),
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull().references(() => worksites.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	changeDate: date("change_date", { mode: 'string' }).notNull(),
	changeTypeId: bigint("change_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	requestedBy: varchar("requested_by", { length: 255 }),
	description: text(),
	budgetImpactId: bigint("budget_impact_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "changes_id" }),
	]);

export const channelUser = pgTable("channel_user", {
	id: bigserial("id", { mode: "number" }).notNull(),
	channelId: bigint("channel_id", { mode: "number" }).notNull().references(() => teamChannels.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "channel_user_id" }),
	]);

export const contacts = pgTable("contacts", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 150 }).notNull(),
	company: varchar({ length: 150 }),
	emailPersonal: varchar("email_personal", { length: 255 }),
	emailCorporativo: varchar("email_corporativo", { length: 255 }),
	phone: varchar({ length: 50 }),
	address: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	firstContactDate: date("first_contact_date", { mode: 'string' }),
	notes: text(),
	contactTypeId: bigint("contact_type_id", { mode: "number" }).references(() => tags.id),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id),
	relationTypeId: bigint("relation_type_id", { mode: "number" }).references(() => tags.id),
	sourceId: bigint("source_id", { mode: "number" }).references(() => tags.id),
	labelId: bigint("label_id", { mode: "number" }).references(() => tags.id),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "contacts_id" }),
	]);

export const contracts = pgTable("contracts", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	categoryId: bigint("category_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	scheduleId: bigint("schedule_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	amount: bigint({ mode: "number" }),
	registeredById: varchar("registered_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "contracts_id" }),
	]);

export const departments = pgTable("departments", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	parentId: bigint("parent_id", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "departments_parent_id_foreign"
		}).onDelete("set null"),
		primaryKey({ columns: [table.id], name: "departments_id" }),
	]);

export const donations = pgTable("donations", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	campaignId: bigint("campaign_id", { mode: "number" }).references(() => campaigns.id, { onDelete: "set null" }),
	amount: bigint({ mode: "number" }).default(0).notNull(),
	paymentMethod: varchar("payment_method", { length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	certified: boolean("certified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "donations_id" }),
	]);

export const employees = pgTable("employees", {
	id: bigserial("id", { mode: "number" }).notNull(),
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
	genderId: bigint("gender_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date("birth_date", { mode: 'string' }),
	birthPlace: varchar("birth_place", { length: 255 }),
	birthCountry: varchar("birth_country", { length: 255 }),
	hasDisability: boolean("has_disability").default(false).notNull(),
	disabilityDetails: text("disability_details"),
	emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
	emergencyContactPhone: varchar("emergency_contact_phone", { length: 255 }),
	educationTypeId: bigint("education_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	maritalStatusId: bigint("marital_status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	numberOfDependents: integer("number_of_dependents").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	departmentId: bigint("department_id", { mode: "number" }).references(() => departments.id, { onDelete: "set null" }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "employees_id" }),
		unique("employees_work_email_unique").on(table.workEmail),
		unique("employees_identification_number_unique").on(table.identificationNumber),
	]);

export const eventItems = pgTable("event_items", {
	id: bigserial("id", { mode: "number" }).notNull(),
	eventId: bigint("event_id", { mode: "number" }).notNull().references(() => events.id, { onDelete: "cascade" }),
	description: varchar({ length: 255 }).notNull(),
	quantity: integer().notNull(),
	unitId: bigint("unit_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
	totalPrice: bigint("total_price", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "event_items_id" }),
	]);

export const events = pgTable("events", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	location: varchar({ length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "events_id" }),
	]);

export const expenses = pgTable("expenses", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	categoryId: bigint("category_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	description: text(),
	amount: bigint({ mode: "number" }),
	resultId: bigint("result_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	createdById: varchar("created_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "expenses_id" }),
	]);

export const failedJobs = pgTable("failed_jobs", {
	id: bigserial("id", { mode: "number" }).notNull(),
	uuid: varchar({ length: 255 }).notNull(),
	connection: text().notNull(),
	queue: text().notNull(),
	payload: text().notNull(),
	exception: text().notNull(),
	failedAt: timestamp("failed_at", { mode: 'string' }).defaultNow().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "failed_jobs_id" }),
		unique("failed_jobs_uuid_unique").on(table.uuid),
	]);

export const files = pgTable("files", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	path: varchar({ length: 255 }).notNull(),
	disk: varchar({ length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 255 }),
	size: bigint({ mode: "number" }),
	folderId: bigint("folder_id", { mode: "number" }).references(() => folders.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "files_id" }),
	]);

export const filesLinks = pgTable("files_links", {
	id: bigserial("id", { mode: "number" }).notNull(),
	areaId: bigint("area_id", { mode: "number" }).references(() => areas.id, { onDelete: "set null" }),
	fileId: bigint("file_id", { mode: "number" }).notNull().references(() => files.id, { onDelete: "cascade" }),
	fileableType: varchar("fileable_type", { length: 255 }).notNull(),
	fileableId: bigint("fileable_id", { mode: "number" }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		index("files_links_fileable_type_fileable_id_index").on(table.fileableType, table.fileableId),
		primaryKey({ columns: [table.id], name: "files_links_id" }),
		unique("files_links_unique").on(table.fileId, table.fileableId, table.fileableType),
	]);

export const folders = pgTable("folders", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	parentId: bigint("parent_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "folders_parent_id_foreign"
		}).onDelete("cascade"),
		primaryKey({ columns: [table.id], name: "folders_id" }),
	]);

export const holidays = pgTable("holidays", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	approverId: varchar("approver_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "holidays_id" }),
	]);

export const incomes = pgTable("incomes", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	categoryId: bigint("category_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	description: text(),
	amount: bigint({ mode: "number" }),
	resultId: bigint("result_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	createdById: varchar("created_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "incomes_id" }),
	]);

export const inductions = pgTable("inductions", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	typeBondId: bigint("type_bond_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	entryDate: date("entry_date", { mode: 'string' }).notNull(),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	confirmationId: bigint("confirmation_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	resource: varchar({ length: 255 }),
	duration: time(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "inductions_id" }),
	]);

export const interviews = pgTable("interviews", {
	id: bigserial("id", { mode: "number" }).notNull(),
	applicantId: bigint("applicant_id", { mode: "number" }).notNull().references(() => applicants.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	time: time(),
	interviewerId: varchar("interviewer_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	interviewTypeId: bigint("interview_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	resultId: bigint("result_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	platform: varchar({ length: 255 }),
	platformUrl: varchar("platform_url", { length: 255 }),
	expectedResults: text("expected_results"),
	interviewerObservations: text("interviewer_observations"),
	rating: decimal({ precision: 3, scale: 1 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "interviews_id" }),
	]);

export const invoices = pgTable("invoices", {
	id: bigserial("id", { mode: "number" }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	invoiceDate: date("invoice_date", { mode: 'string' }).notNull(),
	code: varchar({ length: 255 }).notNull(),
	contactId: bigint("contact_id", { mode: "number" }).references(() => contacts.id, { onDelete: "set null" }),
	description: text(),
	createdById: varchar("created_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	total: bigint({ mode: "number" }),
	methodPayment: varchar("method_payment", { length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "invoices_id" }),
	]);

export const jobBatches = pgTable("job_batches", {
	id: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	totalJobs: integer("total_jobs").notNull(),
	pendingJobs: integer("pending_jobs").notNull(),
	failedJobs: integer("failed_jobs").notNull(),
	failedJobIds: text("failed_job_ids").notNull(),
	options: text(),
	cancelledAt: integer("cancelled_at"),
	createdAt: integer("created_at").notNull(),
	finishedAt: integer("finished_at"),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "job_batches_id" }),
	]);

export const jobs = pgTable("jobs", {
	id: bigserial("id", { mode: "number" }).notNull(),
	queue: varchar({ length: 255 }).notNull(),
	payload: text().notNull(),
	attempts: smallint("attempts").notNull(),
	reservedAt: integer("reserved_at"),
	availableAt: integer("available_at").notNull(),
	createdAt: integer("created_at").notNull(),
},
	(table) => [
		index("jobs_queue_index").on(table.queue),
		primaryKey({ columns: [table.id], name: "jobs_id" }),
	]);

export const kits = pgTable("kits", {
	id: bigserial("id", { mode: "number" }).notNull(),
	requestedByUserId: varchar("requested_by_user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	positionArea: varchar("position_area", { length: 255 }).notNull(),
	recipientName: varchar("recipient_name", { length: 255 }).notNull(),
	recipientRole: varchar("recipient_role", { length: 255 }).notNull(),
	kitType: varchar("kit_type", { length: 255 }),
	kitContents: text("kit_contents"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	requestDate: date("request_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	deliveryDate: date("delivery_date", { mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	deliveryResponsibleUserId: varchar("delivery_responsible_user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "kits_id" }),
	]);

export const kpiRecords = pgTable("kpi_records", {
	id: bigserial("id", { mode: "number" }).notNull(),
	kpiId: bigint("kpi_id", { mode: "number" }).notNull().references(() => kpis.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	recordDate: date("record_date", { mode: 'string' }),
	value: decimal({ precision: 10, scale: 2 }),
	observation: text(),
	createdById: varchar("created_by_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "kpi_records_id" }),
	]);

export const kpis = pgTable("kpis", {
	id: bigserial("id", { mode: "number" }).notNull(),
	protocolCode: varchar("protocol_code", { length: 255 }),
	indicatorName: varchar("indicator_name", { length: 255 }).notNull(),
	periodicityDays: integer("periodicity_days").default(30).notNull(),
	targetValue: decimal("target_value", { precision: 10, scale: 2 }),
	roleId: bigint("role_id", { mode: "number" }).references(() => roles.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "kpis_id" }),
	]);

export const licenseStatusUpdates = pgTable("license_status_updates", {
	id: bigserial("id", { mode: "number" }).notNull(),
	licenseId: bigint("license_id", { mode: "number" }).notNull().references(() => licenses.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	description: text(),
	internalNotes: text("internal_notes"),
	createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "license_status_updates_id" }),
	]);

export const licenses = pgTable("licenses", {
	id: bigserial("id", { mode: "number" }).notNull(),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
	licenseTypeId: bigint("license_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	entity: varchar({ length: 255 }),
	company: varchar({ length: 255 }),
	eradicatedNumber: varchar("eradicated_number", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eradicatdDate: date("eradicatd_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	estimatedApprovalDate: date("estimated_approval_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expirationDate: date("expiration_date", { mode: 'string' }),
	requiresExtension: boolean("requires_extension").default(false).notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "licenses_id" }),
	]);

export const meetingResponsibles = pgTable("meeting_responsibles", {
	id: bigserial("id", { mode: "number" }).notNull(),
	meetingId: bigint("meeting_id", { mode: "number" }).notNull().references(() => meetings.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "meeting_responsibles_id" }),
	]);

export const meetings = pgTable("meetings", {
	id: bigserial("id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	teamId: bigint("team_id", { mode: "number" }).references(() => teams.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	notes: text(),
	url: varchar({ length: 255 }),
	observations: text(),
	goal: boolean("goal").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	bookingId: varchar({ length: 255 }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "meetings_id" }),
	]);

export const messageMentions = pgTable("message_mentions", {
	id: bigserial("id", { mode: "number" }).notNull(),
	messageId: bigint("message_id", { mode: "number" }).notNull().references(() => messages.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "message_mentions_id" }),
	]);

export const messageReactions = pgTable("message_reactions", {
	id: bigserial("id", { mode: "number" }).notNull(),
	messageId: bigint("message_id", { mode: "number" }).notNull().references(() => messages.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	emoji: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "message_reactions_id" }),
		unique("message_reactions_message_id_user_id_unique").on(table.messageId, table.userId),
	]);

export const messages = pgTable("messages", {
	id: bigserial("id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	channelId: bigint("channel_id", { mode: "number" }).references(() => teamChannels.id, { onDelete: "set null" }),
	privateChatId: bigint("private_chat_id", { mode: "number" }).references(() => privateChats.id, { onDelete: "set null" }),
	content: text(),
	type: varchar({ length: 255 }).default('text').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	parentId: bigint("parent_id", { mode: "number" }),
},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "messages_parent_id_foreign"
		}).onDelete("cascade"),
		primaryKey({ columns: [table.id], name: "messages_id" }),
	]);

export const migrations = pgTable("migrations", {
	id: serial("id").notNull(),
	migration: varchar({ length: 255 }).notNull(),
	batch: integer().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "migrations_id" }),
	]);

export const modelHasPermissions = pgTable("model_has_permissions", {
	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade" }),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	modelId: bigint("model_id", { mode: "number" }).notNull(),
},
	(table) => [
		index("model_has_permissions_model_id_model_type_index").on(table.modelId, table.modelType),
		primaryKey({ columns: [table.permissionId, table.modelId, table.modelType], name: "model_has_permissions_permission_id_model_id_model_type" }),
	]);

export const modelHasRoles = pgTable("model_has_roles", {
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade" }),
	modelType: varchar("model_type", { length: 255 }).notNull(),
	modelId: bigint("model_id", { mode: "number" }).notNull(),
},
	(table) => [
		index("model_has_roles_model_id_model_type_index").on(table.modelId, table.modelType),
		primaryKey({ columns: [table.roleId, table.modelId, table.modelType], name: "model_has_roles_role_id_model_id_model_type" }),
	]);

export const accounts = pgTable("accounts", {
	id: varchar({ length: 36 }).notNull(),
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
},
	(table) => [
		index("user_id").on(table.userId),
		primaryKey({ columns: [table.id], name: "accounts_id" }),
	]);

export const sessions = pgTable("sessions", {
	id: varchar({ length: 36 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: varchar("user_id", { length: 36 }).notNull(),
},
	(table) => [
		index("sessions_user_id_index").on(table.userId),
		primaryKey({ columns: [table.id], name: "sessions_id" }),
		unique("token").on(table.token),
	]);

export const userRoles = pgTable("user_roles", {
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade" }),
},
	(table) => [
		index("user_roles_role_id_index").on(table.roleId),
		primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_user_id_role_id" }),
	]);

export const users = pgTable("users", {
	id: varchar({ length: 36 }).notNull(),
	name: text().notNull(),
	email: varchar({ length: 255 }).notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "users_id" }),
		unique("email").on(table.email),
	]);

export const verifications = pgTable("verifications", {
	id: varchar({ length: 36 }).notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "verifications_id" }),
	]);

export const norms = pgTable("norms", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "norms_id" }),
	]);

export const notificationTemplates = pgTable("notification_templates", {
	id: bigserial("id", { mode: "number" }).notNull(),
	type: text().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	data: json(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	notifiableType: varchar("notifiable_type", { length: 255 }),
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
},
	(table) => [
		index("notification_templates_notifiable_type_notifiable_id_index").on(table.notifiableType, table.notifiableId),
		index("notification_templates_type_is_active_next_send_at_index").on(table.type, table.isActive, table.nextSendAt),
		index("notification_templates_user_id_is_active_index").on(table.userId, table.isActive),
		primaryKey({ columns: [table.id], name: "notification_templates_id" }),
	]);

export const notifications = pgTable("notifications", {
	id: bigserial("id", { mode: "number" }).notNull(),
	templateId: bigint("template_id", { mode: "number" }).references(() => notificationTemplates.id, { onDelete: "set null" }),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	data: json(),
	notifiableType: varchar("notifiable_type", { length: 255 }),
	notifiableId: bigint("notifiable_id", { mode: "number" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	readAt: timestamp("read_at", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		index("notifications_notifiable_type_notifiable_id_index").on(table.notifiableType, table.notifiableId),
		index("notifications_user_id_read_at_index").on(table.userId, table.readAt),
		index("notifications_user_id_status_index").on(table.userId),
		primaryKey({ columns: [table.id], name: "notifications_id" }),
	]);

export const oauthConnections = pgTable("oauth_connections", {
	id: bigserial("id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
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
},
	(table) => [
		primaryKey({ columns: [table.id], name: "oauth_connections_id" }),
		unique("oauth_connections_user_id_provider_unique").on(table.userId, table.provider),
	]);

export const offBoardingTasks = pgTable("off_boarding_tasks", {
	id: bigserial("id", { mode: "number" }).notNull(),
	offBoardingId: bigint("off_boarding_id", { mode: "number" }).notNull().references(() => offBoardings.id, { onDelete: "cascade" }),
	content: text().notNull(),
	completed: smallint().default(0).notNull(),
	teamId: bigint("team_id", { mode: "number" }).references(() => teams.id, { onDelete: "set null" }),
	completedBy: varchar("completed_by", { length: 36 }).references(() => users.id),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "off_boarding_tasks_id" }),
	]);

export const offBoardings = pgTable("off_boardings", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
	reason: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	exitDate: date("exit_date", { mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "off_boardings_id" }),
	]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	email: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.email], name: "password_reset_tokens_email" }),
	]);

export const payrolls = pgTable("payrolls", {
	id: bigserial("id", { mode: "number" }).notNull(),
	employeeId: bigint("employee_id", { mode: "number" }).references(() => employees.id, { onDelete: "set null" }),
	subtotal: bigint({ mode: "number" }).notNull(),
	bonos: bigint({ mode: "number" }),
	deductions: bigint({ mode: "number" }),
	total: bigint({ mode: "number" }).notNull(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "payrolls_id" }),
	]);

export const permissions = pgTable("permissions", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	areaId: bigint("area_id", { mode: "number" }).references(() => areas.id, { onDelete: "cascade" }),
	action: varchar({ length: 255 }).notNull(),
},
	(table) => [
		index("permissions_area_id_index").on(table.areaId),
		primaryKey({ columns: [table.id], name: "permissions_id" }),
		unique("permissions_name_guard_name_area_id_unique").on(table.name, table.guardName, table.areaId),
	]);

export const personalAccessTokens = pgTable("personal_access_tokens", {
	id: bigserial("id", { mode: "number" }).notNull(),
	tokenableType: varchar("tokenable_type", { length: 255 }).notNull(),
	tokenableId: bigint("tokenable_id", { mode: "number" }).notNull(),
	name: text().notNull(),
	token: varchar({ length: 64 }).notNull(),
	abilities: text(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		index("personal_access_tokens_tokenable_type_tokenable_id_index").on(table.tokenableType, table.tokenableId),
		index("personal_access_tokens_expires_at_index").on(table.expiresAt),
		primaryKey({ columns: [table.id], name: "personal_access_tokens_id" }),
		unique("personal_access_tokens_token_unique").on(table.token),
	]);

export const plans = pgTable("plans", {
	id: bigserial("id", { mode: "number" }).notNull(),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "cascade" }),
	teamId: bigint("team_id", { mode: "number" }).references(() => teams.id, { onDelete: "cascade" }),
	ownerId: varchar("owner_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "plans_id" }),
	]);

export const policies = pgTable("policies", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	issuedAt: date("issued_at", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	reviewedAt: date("reviewed_at", { mode: 'string' }),
	assignedToId: varchar("assigned_to_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "policies_id" }),
	]);

export const privateChatUser = pgTable("private_chat_user", {
	id: bigserial("id", { mode: "number" }).notNull(),
	privateChatId: bigint("private_chat_id", { mode: "number" }).notNull().references(() => privateChats.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "private_chat_user_id" }),
	]);

export const privateChats = pgTable("private_chats", {
	id: bigserial("id", { mode: "number" }).notNull(),
	isGroup: boolean("is_group").default(false).notNull(),
	name: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "private_chats_id" }),
	]);

export const projects = pgTable("projects", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	direction: varchar({ length: 255 }),
	contactId: bigint("contact_id", { mode: "number" }).references(() => contacts.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	projectTypeId: bigint("project_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	currentStageId: bigint("current_stage_id", { mode: "number" }).references(() => stages.id, { onDelete: "set null" }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	teamId: bigint("team_id", { mode: "number" }).references(() => teams.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "projects_id" }),
	]);

export const punchItems = pgTable("punch_items", {
	id: bigserial("id", { mode: "number" }).notNull(),
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull().references(() => worksites.id, { onDelete: "cascade" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	observations: text(),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "punch_items_id" }),
	]);

export const quotes = pgTable("quotes", {
	id: bigserial("id", { mode: "number" }).notNull(),
	contactId: bigint("contact_id", { mode: "number" }).references(() => contacts.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	issuedAt: date("issued_at", { mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	total: bigint({ mode: "number" }),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "quotes_id" }),
	]);

export const reports = pgTable("reports", {
	id: bigserial("id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }),
	hour: time(),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "reports_id" }),
	]);

export const roleHasPermissions = pgTable("role_has_permissions", {
	permissionId: bigint("permission_id", { mode: "number" }).notNull().references(() => permissions.id, { onDelete: "cascade" }),
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => roles.id, { onDelete: "cascade" }),
},
	(table) => [
		primaryKey({ columns: [table.permissionId, table.roleId], name: "role_has_permissions_permission_id_role_id" }),
	]);

export const roles = pgTable("roles", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }).notNull(),
	guardName: varchar("guard_name", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "roles_id" }),
		unique("roles_name_guard_name_unique").on(table.name, table.guardName),
	]);


export const shares = pgTable("shares", {
	id: bigserial("id", { mode: "number" }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	sharedWithUserId: varchar("shared_with_user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }),
	sharedWithTeamId: bigint("shared_with_team_id", { mode: "number" }).references(() => teams.id, { onDelete: "cascade" }),
	shareableType: varchar("shareable_type", { length: 255 }).notNull(),
	shareableId: bigint("shareable_id", { mode: "number" }).notNull(),
	permission: text().default('view').notNull(),
	shareToken: varchar("share_token", { length: 255 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		index("shares_shareable_type_shareable_id_index").on(table.shareableType, table.shareableId),
		primaryKey({ columns: [table.id], name: "shares_id" }),
		unique("shares_share_token_unique").on(table.shareToken),
	]);

export const socialMediaPosts = pgTable("social_media_posts", {
	id: bigserial("id", { mode: "number" }).notNull(),
	mediums: varchar({ length: 255 }),
	contentType: varchar("content_type", { length: 255 }),
	pieceName: varchar("piece_name", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	scheduledDate: date("scheduled_date", { mode: 'string' }),
	projectId: bigint("project_id", { mode: "number" }).references(() => projects.id, { onDelete: "set null" }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	comments: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "social_media_posts_id" }),
	]);

export const stages = pgTable("stages", {
	id: bigserial("id", { mode: "number" }).notNull(),
	projectId: bigint("project_id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "stages_id" }),
	]);

export const strategies = pgTable("strategies", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	objective: varchar({ length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	targetAudience: varchar("target_audience", { length: 255 }),
	platforms: varchar({ length: 255 }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	notifyTeam: boolean("notify_team").default(false).notNull(),
	addToCalendar: boolean("add_to_calendar").default(false).notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "strategies_id" }),
	]);

export const subs = pgTable("subs", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	frequencyId: bigint("frequency_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	type: varchar({ length: 255 }),
	amount: bigint({ mode: "number" }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	renewalDate: date("renewal_date", { mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "subs_id" }),
	]);

export const tagCategories = pgTable("tag_categories", {
	id: bigserial("id", { mode: "number" }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	label: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "tag_categories_id" }),
		unique("tag_categories_slug_unique").on(table.slug),
	]);

export const tags = pgTable("tags", {
	id: bigserial("id", { mode: "number" }).notNull(),
	categoryId: bigint("category_id", { mode: "number" }).notNull().references(() => tagCategories.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	color: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "tags_id" }),
		unique("tags_category_id_name_unique").on(table.categoryId, table.name),
		unique("tags_slug_unique").on(table.slug),
	]);

export const taskUser = pgTable("task_user", {
	id: bigserial("id", { mode: "number" }).notNull(),
	taskId: bigint("task_id", { mode: "number" }).notNull().references(() => tasks.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "task_user_id" }),
	]);

export const tasks = pgTable("tasks", {
	id: bigserial("id", { mode: "number" }).notNull(),
	bucketId: bigint("bucket_id", { mode: "number" }).notNull().references(() => buckets.id, { onDelete: "cascade" }),
	order: integer().default(1).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	priorityId: bigint("priority_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	createdBy: varchar("created_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	notes: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "tasks_id" }),
	]);

export const taxRecords = pgTable("tax_records", {
	id: bigserial("id", { mode: "number" }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	entity: varchar({ length: 255 }).notNull(),
	base: bigint({ mode: "number" }).notNull(),
	porcentage: bigint({ mode: "number" }).notNull(),
	amount: bigint({ mode: "number" }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	observations: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "tax_records_id" }),
	]);

export const teamChannels = pgTable("team_channels", {
	id: bigserial("id", { mode: "number" }).notNull(),
	teamId: bigint("team_id", { mode: "number" }).notNull().references(() => teams.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	isPrivate: boolean("is_private").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	parentId: bigint("parent_id", { mode: "number" }),
},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "team_channels_parent_id_foreign"
		}).onDelete("cascade"),
		primaryKey({ columns: [table.id], name: "team_channels_id" }),
		unique("team_channels_slug_unique").on(table.slug),
	]);

export const teamRoles = pgTable("team_roles", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "team_roles_id" }),
		unique("team_roles_slug_unique").on(table.slug),
	]);

export const teamUser = pgTable("team_user", {
	id: bigserial("id", { mode: "number" }).notNull(),
	teamId: bigint("team_id", { mode: "number" }).notNull().references(() => teams.id, { onDelete: "cascade" }),
	userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
	roleId: bigint("role_id", { mode: "number" }).notNull().references(() => teamRoles.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "team_user_id" }),
	]);

export const teams = pgTable("teams", {
	id: bigserial("id", { mode: "number" }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	profilePhotoPath: varchar("profile_photo_path", { length: 2048 }),
	isPublic: boolean("isPublic").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "teams_id" }),
	]);


export const vacancies = pgTable("vacancies", {
	id: bigserial("id", { mode: "number" }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	area: varchar({ length: 255 }),
	contractTypeId: bigint("contract_type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	publishedAt: date("published_at", { mode: 'string' }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "vacancies_id" }),
	]);

export const visits = pgTable("visits", {
	id: bigserial("id", { mode: "number" }).notNull(),
	worksiteId: bigint("worksite_id", { mode: "number" }).notNull().references(() => worksites.id, { onDelete: "cascade" }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	visitDate: date("visit_date", { mode: 'string' }),
	performedBy: varchar("performed_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	generalObservations: text("general_observations"),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	internalNotes: text("internal_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "visits_id" }),
	]);

export const volunteers = pgTable("volunteers", {
	id: bigserial("id", { mode: "number" }).notNull(),
	campaignId: bigint("campaign_id", { mode: "number" }).references(() => campaigns.id, { onDelete: "set null" }),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	address: varchar({ length: 255 }),
	city: varchar({ length: 255 }),
	state: varchar({ length: 255 }),
	country: varchar({ length: 255 }),
	role: varchar({ length: 255 }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	certified: boolean("certified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "volunteers_id" }),
		unique("volunteers_email_unique").on(table.email),
		unique("volunteers_phone_unique").on(table.phone),
	]);

export const worksites = pgTable("worksites", {
	id: bigserial("id", { mode: "number" }).notNull(),
	projectId: bigint("project_id", { mode: "number" }).notNull().references(() => projects.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	typeId: bigint("type_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	statusId: bigint("status_id", { mode: "number" }).references(() => tags.id, { onDelete: "set null" }),
	responsibleId: varchar("responsible_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
	address: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
},
	(table) => [
		primaryKey({ columns: [table.id], name: "worksites_id" }),
	]);
