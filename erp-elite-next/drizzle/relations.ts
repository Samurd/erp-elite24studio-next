import { relations } from "drizzle-orm/relations";
import { projects, adpieces, tags, strategies, teams, alliances, applicants, vacancies, users, approvals, approvers, campaigns, apuCampaigns, areas, employees, attendances, audits, contacts, birthdays, plans, buckets, calendarEvents, caseMarketings, caseRecords, certificates, changes, worksites, teamChannels, channelUser, contracts, departments, donations, events, eventItems, expenses, folders, files, filesLinks, holidays, incomes, inductions, interviews, invoices, kits, kpiRecords, kpis, roles, licenseStatusUpdates, licenses, meetings, meetingResponsibles, messages, messageMentions, messageReactions, privateChats, permissions, modelHasPermissions, modelHasRoles, userRoles, norms, notificationTemplates, notifications, oauthConnections, offBoardingTasks, offBoardings, payrolls, policies, privateChatUser, stages, punchItems, quotes, reports, roleHasPermissions, shares, socialMediaPosts, subs, tagCategories, tasks, taskUser, taxRecords, teamRoles, teamUser, visits, volunteers } from "./schema";

export const adpiecesRelations = relations(adpieces, ({ one }) => ({
	project: one(projects, {
		fields: [adpieces.projectId],
		references: [projects.id]
	}),
	status: one(tags, {
		fields: [adpieces.statusId],
		references: [tags.id],
		relationName: "adpieces_statusId_tags_id"
	}),
	strategy: one(strategies, {
		fields: [adpieces.strategyId],
		references: [strategies.id]
	}),
	team: one(teams, {
		fields: [adpieces.teamId],
		references: [teams.id]
	}),
	type: one(tags, {
		fields: [adpieces.typeId],
		references: [tags.id],
		relationName: "adpieces_typeId_tags_id"
	}),
	format: one(tags, {
		fields: [adpieces.formatId],
		references: [tags.id],
	}),
}));

export const caseMarketingsRelations = relations(caseMarketings, ({ one }) => ({
	project: one(projects, {
		fields: [caseMarketings.projectId],
		references: [projects.id]
	}),
	responsible: one(users, {
		fields: [caseMarketings.responsibleId],
		references: [users.id]
	}),
	type: one(tags, {
		fields: [caseMarketings.typeId],
		references: [tags.id],
	}),
	status: one(tags, {
		fields: [caseMarketings.statusId],
		references: [tags.id],
	}),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	adpieces: many(adpieces),
	caseMarketings: many(caseMarketings),
	licenses: many(licenses),
	offBoardings: many(offBoardings),
	plans: many(plans),
	contact: one(contacts, {
		fields: [projects.contactId],
		references: [contacts.id]
	}),
	stage: one(stages, {
		fields: [projects.currentStageId],
		references: [stages.id]
	}),
	tag_projectTypeId: one(tags, {
		fields: [projects.projectTypeId],
		references: [tags.id],
		relationName: "projects_projectTypeId_tags_id"
	}),
	user: one(users, {
		fields: [projects.responsibleId],
		references: [users.id]
	}),
	tag_statusId: one(tags, {
		fields: [projects.statusId],
		references: [tags.id],
		relationName: "projects_statusId_tags_id"
	}),
	team: one(teams, {
		fields: [projects.teamId],
		references: [teams.id]
	}),
	socialMediaPosts: many(socialMediaPosts),
	worksites: many(worksites),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	adpieces_statusId: many(adpieces, {
		relationName: "adpieces_statusId_tags_id"
	}),
	adpieces_typeId: many(adpieces, {
		relationName: "adpieces_typeId_tags_id"
	}),
	alliances: many(alliances),
	applicants: many(applicants),
	approvals_priorityId: many(approvals, {
		relationName: "approvals_priorityId_tags_id"
	}),
	approvals_statusId: many(approvals, {
		relationName: "approvals_statusId_tags_id"
	}),
	approvers: many(approvers),
	apuCampaigns: many(apuCampaigns),
	attendances_modalityId: many(attendances, {
		relationName: "attendances_modalityId_tags_id"
	}),
	attendances_statusId: many(attendances, {
		relationName: "attendances_statusId_tags_id"
	}),
	audits_statusId: many(audits, {
		relationName: "audits_statusId_tags_id"
	}),
	audits_typeId: many(audits, {
		relationName: "audits_typeId_tags_id"
	}),
	campaigns: many(campaigns),
	caseMarketings_statusId: many(caseMarketings, {
		relationName: "caseMarketings_statusId_tags_id"
	}),
	caseMarketings_typeId: many(caseMarketings, {
		relationName: "caseMarketings_typeId_tags_id"
	}),
	caseRecords_caseTypeId: many(caseRecords, {
		relationName: "caseRecords_caseTypeId_tags_id"
	}),
	caseRecords_statusId: many(caseRecords, {
		relationName: "caseRecords_statusId_tags_id"
	}),
	certificates_statusId: many(certificates, {
		relationName: "certificates_statusId_tags_id"
	}),
	certificates_typeId: many(certificates, {
		relationName: "certificates_typeId_tags_id"
	}),
	changes_budgetImpactId: many(changes, {
		relationName: "changes_budgetImpactId_tags_id"
	}),
	changes_changeTypeId: many(changes, {
		relationName: "changes_changeTypeId_tags_id"
	}),
	changes_statusId: many(changes, {
		relationName: "changes_statusId_tags_id"
	}),
	contacts_contactTypeId: many(contacts, {
		relationName: "contacts_contactTypeId_tags_id"
	}),
	contacts_labelId: many(contacts, {
		relationName: "contacts_labelId_tags_id"
	}),
	contacts_relationTypeId: many(contacts, {
		relationName: "contacts_relationTypeId_tags_id"
	}),
	contacts_sourceId: many(contacts, {
		relationName: "contacts_sourceId_tags_id"
	}),
	contacts_statusId: many(contacts, {
		relationName: "contacts_statusId_tags_id"
	}),
	contracts_categoryId: many(contracts, {
		relationName: "contracts_categoryId_tags_id"
	}),
	contracts_scheduleId: many(contracts, {
		relationName: "contracts_scheduleId_tags_id"
	}),
	contracts_statusId: many(contracts, {
		relationName: "contracts_statusId_tags_id"
	}),
	contracts_typeId: many(contracts, {
		relationName: "contracts_typeId_tags_id"
	}),
	employees_educationTypeId: many(employees, {
		relationName: "employees_educationTypeId_tags_id"
	}),
	employees_genderId: many(employees, {
		relationName: "employees_genderId_tags_id"
	}),
	employees_maritalStatusId: many(employees, {
		relationName: "employees_maritalStatusId_tags_id"
	}),
	eventItems: many(eventItems),
	events_statusId: many(events, {
		relationName: "events_statusId_tags_id"
	}),
	events_typeId: many(events, {
		relationName: "events_typeId_tags_id"
	}),
	expenses_categoryId: many(expenses, {
		relationName: "expenses_categoryId_tags_id"
	}),
	expenses_resultId: many(expenses, {
		relationName: "expenses_resultId_tags_id"
	}),
	holidays_statusId: many(holidays, {
		relationName: "holidays_statusId_tags_id"
	}),
	holidays_typeId: many(holidays, {
		relationName: "holidays_typeId_tags_id"
	}),
	incomes_categoryId: many(incomes, {
		relationName: "incomes_categoryId_tags_id"
	}),
	incomes_resultId: many(incomes, {
		relationName: "incomes_resultId_tags_id"
	}),
	incomes_typeId: many(incomes, {
		relationName: "incomes_typeId_tags_id"
	}),
	inductions_confirmationId: many(inductions, {
		relationName: "inductions_confirmationId_tags_id"
	}),
	inductions_statusId: many(inductions, {
		relationName: "inductions_statusId_tags_id"
	}),
	inductions_typeBondId: many(inductions, {
		relationName: "inductions_typeBondId_tags_id"
	}),
	interviews_interviewTypeId: many(interviews, {
		relationName: "interviews_interviewTypeId_tags_id"
	}),
	interviews_resultId: many(interviews, {
		relationName: "interviews_resultId_tags_id"
	}),
	interviews_statusId: many(interviews, {
		relationName: "interviews_statusId_tags_id"
	}),
	invoices: many(invoices),
	kits: many(kits),
	licenseStatusUpdates: many(licenseStatusUpdates),
	licenses_licenseTypeId: many(licenses, {
		relationName: "licenses_licenseTypeId_tags_id"
	}),
	licenses_statusId: many(licenses, {
		relationName: "licenses_statusId_tags_id"
	}),
	meetings: many(meetings),
	offBoardings: many(offBoardings),
	payrolls: many(payrolls, {
		relationName: "payrolls_statusId_tags_id"
	}),
	policies_statusId: many(policies, {
		relationName: "policies_statusId_tags_id"
	}),
	policies_typeId: many(policies, {
		relationName: "policies_typeId_tags_id"
	}),
	projects_projectTypeId: many(projects, {
		relationName: "projects_projectTypeId_tags_id"
	}),
	projects_statusId: many(projects, {
		relationName: "projects_statusId_tags_id"
	}),
	punchItems: many(punchItems),
	quotes: many(quotes),
	reports: many(reports),
	socialMediaPosts: many(socialMediaPosts),
	strategies: many(strategies),
	subs_frequencyId: many(subs, {
		relationName: "subs_frequencyId_tags_id"
	}),
	subs_statusId: many(subs, {
		relationName: "subs_statusId_tags_id"
	}),
	tagCategory: one(tagCategories, {
		fields: [tags.categoryId],
		references: [tagCategories.id]
	}),
	tasks_priorityId: many(tasks, {
		relationName: "tasks_priorityId_tags_id"
	}),
	tasks_statusId: many(tasks, {
		relationName: "tasks_statusId_tags_id"
	}),
	taxRecords_statusId: many(taxRecords, {
		relationName: "taxRecords_statusId_tags_id"
	}),
	taxRecords_typeId: many(taxRecords, {
		relationName: "taxRecords_typeId_tags_id"
	}),
	vacancies_contractTypeId: many(vacancies, {
		relationName: "vacancies_contractTypeId_tags_id"
	}),
	vacancies_statusId: many(vacancies, {
		relationName: "vacancies_statusId_tags_id"
	}),
	visits: many(visits),
	volunteers: many(volunteers),
	worksites_statusId: many(worksites, {
		relationName: "worksites_statusId_tags_id"
	}),
	worksites_typeId: many(worksites, {
		relationName: "worksites_typeId_tags_id"
	}),
}));

export const strategiesRelations = relations(strategies, ({ one, many }) => ({
	adpieces: many(adpieces),
	responsible: one(users, {
		fields: [strategies.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [strategies.statusId],
		references: [tags.id]
	}),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
	adpieces: many(adpieces),
	meetings: many(meetings),
	offBoardingTasks: many(offBoardingTasks),
	plans: many(plans),
	projects: many(projects),
	shares: many(shares),
	teamChannels: many(teamChannels),
	teamUsers: many(teamUser),
}));

export const alliancesRelations = relations(alliances, ({ one }) => ({
	type: one(tags, {
		fields: [alliances.typeId],
		references: [tags.id]
	}),
}));

export const applicantsRelations = relations(applicants, ({ one, many }) => ({
	status: one(tags, {
		fields: [applicants.statusId],
		references: [tags.id]
	}),
	vacancy: one(vacancies, {
		fields: [applicants.vacancyId],
		references: [vacancies.id]
	}),
	interviews: many(interviews),
}));

export const vacanciesRelations = relations(vacancies, ({ one, many }) => ({
	applicants: many(applicants),
	contractType: one(tags, {
		fields: [vacancies.contractTypeId],
		references: [tags.id],
		relationName: "vacancies_contractTypeId_tags_id"
	}),
	status: one(tags, {
		fields: [vacancies.statusId],
		references: [tags.id],
		relationName: "vacancies_statusId_tags_id"
	}),
	user: one(users, {
		fields: [vacancies.userId],
		references: [users.id]
	}),
}));

export const approvalsRelations = relations(approvals, ({ one, many }) => ({
	user: one(users, {
		fields: [approvals.createdById],
		references: [users.id]
	}),
	tag_priorityId: one(tags, {
		fields: [approvals.priorityId],
		references: [tags.id],
		relationName: "approvals_priorityId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [approvals.statusId],
		references: [tags.id],
		relationName: "approvals_statusId_tags_id"
	}),
	approvers: many(approvers),
	filesLinks: many(filesLinks),
}));

export const usersRelations = relations(users, ({ many }) => ({
	approvals: many(approvals),
	userRoles: many(userRoles),
	approvers: many(approvers),
	birthdays: many(birthdays),
	calendarEvents: many(calendarEvents),
	campaigns: many(campaigns),
	caseMarketings: many(caseMarketings),
	caseRecords: many(caseRecords),
	certificates: many(certificates),
	changes: many(changes),
	channelUsers: many(channelUser),
	contacts: many(contacts),
	contracts: many(contracts),
	events: many(events),
	expenses: many(expenses),
	files: many(files),
	folders: many(folders),
	holidays: many(holidays),
	incomes: many(incomes),
	inductions: many(inductions),
	interviews: many(interviews),
	invoices: many(invoices),
	kits_deliveryResponsibleUserId: many(kits, {
		relationName: "kits_deliveryResponsibleUserId_users_id"
	}),
	kits_requestedByUserId: many(kits, {
		relationName: "kits_requestedByUserId_users_id"
	}),
	kpiRecords: many(kpiRecords),
	licenseStatusUpdates_createdBy: many(licenseStatusUpdates, {
		relationName: "licenseStatusUpdates_createdBy_users_id"
	}),
	licenseStatusUpdates_responsibleId: many(licenseStatusUpdates, {
		relationName: "licenseStatusUpdates_responsibleId_users_id"
	}),
	meetingResponsibles: many(meetingResponsibles),
	messageMentions: many(messageMentions),
	messageReactions: many(messageReactions),
	messages: many(messages),
	norms: many(norms),
	notificationTemplates: many(notificationTemplates),
	notifications: many(notifications),
	oauthConnections: many(oauthConnections),
	offBoardingTasks: many(offBoardingTasks),
	offBoardings: many(offBoardings),
	plans: many(plans),
	policies: many(policies),
	privateChatUsers: many(privateChatUser),
	projects: many(projects),
	punchItems: many(punchItems),
	quotes: many(quotes),
	reports: many(reports),
	shares_sharedWithUserId: many(shares, {
		relationName: "shares_sharedWithUserId_users_id"
	}),
	shares_userId: many(shares, {
		relationName: "shares_userId_users_id"
	}),
	socialMediaPosts: many(socialMediaPosts),
	strategies: many(strategies),
	subs: many(subs),
	taskUsers: many(taskUser),
	tasks: many(tasks),
	teamUsers: many(teamUser),
	vacancies: many(vacancies),
	visits: many(visits),
	worksites: many(worksites),
}));

export const approversRelations = relations(approvers, ({ one }) => ({
	approval: one(approvals, {
		fields: [approvers.approvalId],
		references: [approvals.id]
	}),
	tag: one(tags, {
		fields: [approvers.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [approvers.userId],
		references: [users.id]
	}),
}));

export const apuCampaignsRelations = relations(apuCampaigns, ({ one }) => ({
	campaign: one(campaigns, {
		fields: [apuCampaigns.campaignId],
		references: [campaigns.id]
	}),
	unit: one(tags, {
		fields: [apuCampaigns.unitId],
		references: [tags.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
	apuCampaigns: many(apuCampaigns),
	user: one(users, {
		fields: [campaigns.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [campaigns.statusId],
		references: [tags.id],
		relationName: "campaigns_statusId_tags_id"
	}),
	donations: many(donations),
	volunteers: many(volunteers),
}));

export const areasRelations = relations(areas, ({ one, many }) => ({
	area: one(areas, {
		fields: [areas.parentId],
		references: [areas.id],
		relationName: "areas_parentId_areas_id"
	}),
	areas: many(areas, {
		relationName: "areas_parentId_areas_id"
	}),
	filesLinks: many(filesLinks),
	permissions: many(permissions),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
	employee: one(employees, {
		fields: [attendances.employeeId],
		references: [employees.id]
	}),
	modality: one(tags, {
		fields: [attendances.modalityId],
		references: [tags.id],
		relationName: "attendances_modalityId_tags_id"
	}),
	status: one(tags, {
		fields: [attendances.statusId],
		references: [tags.id],
		relationName: "attendances_statusId_tags_id"
	}),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
	attendances: many(attendances),
	birthdays: many(birthdays),
	contracts: many(contracts),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id]
	}),
	tag_educationTypeId: one(tags, {
		fields: [employees.educationTypeId],
		references: [tags.id],
		relationName: "employees_educationTypeId_tags_id"
	}),
	tag_genderId: one(tags, {
		fields: [employees.genderId],
		references: [tags.id],
		relationName: "employees_genderId_tags_id"
	}),
	tag_maritalStatusId: one(tags, {
		fields: [employees.maritalStatusId],
		references: [tags.id],
		relationName: "employees_maritalStatusId_tags_id"
	}),
	holidays: many(holidays),
	inductions: many(inductions),
	offBoardings: many(offBoardings),
	payrolls: many(payrolls),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
	tag_statusId: one(tags, {
		fields: [audits.statusId],
		references: [tags.id],
		relationName: "audits_statusId_tags_id"
	}),
	tag_typeId: one(tags, {
		fields: [audits.typeId],
		references: [tags.id],
		relationName: "audits_typeId_tags_id"
	}),
	filesLinks: many(filesLinks),
}));

export const birthdaysRelations = relations(birthdays, ({ one }) => ({
	contact: one(contacts, {
		fields: [birthdays.contactId],
		references: [contacts.id]
	}),
	employee: one(employees, {
		fields: [birthdays.employeeId],
		references: [employees.id]
	}),
	responsible: one(users, {
		fields: [birthdays.responsibleId],
		references: [users.id]
	}),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
	birthdays: many(birthdays),
	caseRecords: many(caseRecords),
	tag_contactTypeId: one(tags, {
		fields: [contacts.contactTypeId],
		references: [tags.id],
		relationName: "contacts_contactTypeId_tags_id"
	}),
	tag_labelId: one(tags, {
		fields: [contacts.labelId],
		references: [tags.id],
		relationName: "contacts_labelId_tags_id"
	}),
	tag_relationTypeId: one(tags, {
		fields: [contacts.relationTypeId],
		references: [tags.id],
		relationName: "contacts_relationTypeId_tags_id"
	}),
	user: one(users, {
		fields: [contacts.responsibleId],
		references: [users.id]
	}),
	tag_sourceId: one(tags, {
		fields: [contacts.sourceId],
		references: [tags.id],
		relationName: "contacts_sourceId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [contacts.statusId],
		references: [tags.id],
		relationName: "contacts_statusId_tags_id"
	}),
	invoices: many(invoices),
	projects: many(projects),
	quotes: many(quotes),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
	plan: one(plans, {
		fields: [buckets.planId],
		references: [plans.id]
	}),
	tasks: many(tasks),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
	buckets: many(buckets),
	user: one(users, {
		fields: [plans.ownerId],
		references: [users.id]
	}),
	// project: one(projects, {
	// 	fields: [plans.projectId],
	// 	references: [projects.id]
	// }),
	// team: one(teams, {
	// 	fields: [plans.teamId],
	// 	references: [teams.id]
	// }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
	user: one(users, {
		fields: [calendarEvents.userId],
		references: [users.id]
	}),
}));



export const caseRecordsRelations = relations(caseRecords, ({ one }) => ({
	user: one(users, {
		fields: [caseRecords.assignedToId],
		references: [users.id]
	}),
	tag_caseTypeId: one(tags, {
		fields: [caseRecords.caseTypeId],
		references: [tags.id],
		relationName: "caseRecords_caseTypeId_tags_id"
	}),
	contact: one(contacts, {
		fields: [caseRecords.contactId],
		references: [contacts.id]
	}),
	tag_statusId: one(tags, {
		fields: [caseRecords.statusId],
		references: [tags.id],
		relationName: "caseRecords_statusId_tags_id"
	}),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
	assignedTo: one(users, {
		fields: [certificates.assignedToId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [certificates.statusId],
		references: [tags.id],
		relationName: "certificates_statusId_tags_id"
	}),
	type: one(tags, {
		fields: [certificates.typeId],
		references: [tags.id],
		relationName: "certificates_typeId_tags_id"
	}),
}));

export const changesRelations = relations(changes, ({ one }) => ({
	approver: one(users, {
		fields: [changes.approvedBy],
		references: [users.id]
	}),
	budgetImpact: one(tags, {
		fields: [changes.budgetImpactId],
		references: [tags.id],
		relationName: "changes_budgetImpactId_tags_id"
	}),
	type: one(tags, {
		fields: [changes.changeTypeId],
		references: [tags.id],
		relationName: "changes_changeTypeId_tags_id"
	}),
	status: one(tags, {
		fields: [changes.statusId],
		references: [tags.id],
		relationName: "changes_statusId_tags_id"
	}),
	worksite: one(worksites, {
		fields: [changes.worksiteId],
		references: [worksites.id]
	}),
}));

export const worksitesRelations = relations(worksites, ({ one, many }) => ({
	changes: many(changes),
	punchItems: many(punchItems),
	visits: many(visits),
	project: one(projects, {
		fields: [worksites.projectId],
		references: [projects.id]
	}),
	responsible: one(users, {
		fields: [worksites.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [worksites.statusId],
		references: [tags.id],
		relationName: "worksites_statusId_tags_id"
	}),
	type: one(tags, {
		fields: [worksites.typeId],
		references: [tags.id],
		relationName: "worksites_typeId_tags_id"
	}),
}));

export const channelUserRelations = relations(channelUser, ({ one }) => ({
	teamChannel: one(teamChannels, {
		fields: [channelUser.channelId],
		references: [teamChannels.id]
	}),
	user: one(users, {
		fields: [channelUser.userId],
		references: [users.id]
	}),
}));

export const teamChannelsRelations = relations(teamChannels, ({ one, many }) => ({
	channelUsers: many(channelUser),
	messages: many(messages),
	teamChannel: one(teamChannels, {
		fields: [teamChannels.parentId],
		references: [teamChannels.id],
		relationName: "teamChannels_parentId_teamChannels_id"
	}),
	teamChannels: many(teamChannels, {
		relationName: "teamChannels_parentId_teamChannels_id"
	}),
	team: one(teams, {
		fields: [teamChannels.teamId],
		references: [teams.id]
	}),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
	tag_categoryId: one(tags, {
		fields: [contracts.categoryId],
		references: [tags.id],
		relationName: "contracts_categoryId_tags_id"
	}),
	employee: one(employees, {
		fields: [contracts.employeeId],
		references: [employees.id]
	}),
	user: one(users, {
		fields: [contracts.registeredById],
		references: [users.id]
	}),
	tag_scheduleId: one(tags, {
		fields: [contracts.scheduleId],
		references: [tags.id],
		relationName: "contracts_scheduleId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [contracts.statusId],
		references: [tags.id],
		relationName: "contracts_statusId_tags_id"
	}),
	tag_typeId: one(tags, {
		fields: [contracts.typeId],
		references: [tags.id],
		relationName: "contracts_typeId_tags_id"
	}),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
	department: one(departments, {
		fields: [departments.parentId],
		references: [departments.id],
		relationName: "departments_parentId_departments_id"
	}),
	departments: many(departments, {
		relationName: "departments_parentId_departments_id"
	}),
	employees: many(employees),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
	campaign: one(campaigns, {
		fields: [donations.campaignId],
		references: [campaigns.id]
	}),
}));

export const eventItemsRelations = relations(eventItems, ({ one }) => ({
	event: one(events, {
		fields: [eventItems.eventId],
		references: [events.id]
	}),
	tag: one(tags, {
		fields: [eventItems.unitId],
		references: [tags.id],
		relationName: "eventItems_unitId_tags_id"
	}),
	unit: one(tags, {
		fields: [eventItems.unitId],
		references: [tags.id],
		relationName: "eventItems_unitId_tags_id"
	}),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
	eventItems: many(eventItems),
	user: one(users, {
		fields: [events.responsibleId],
		references: [users.id]
	}),
	tag_statusId: one(tags, {
		fields: [events.statusId],
		references: [tags.id],
		relationName: "events_statusId_tags_id"
	}),
	status: one(tags, {
		fields: [events.statusId],
		references: [tags.id],
		relationName: "events_statusId_tags_id"
	}),
	tag_typeId: one(tags, {
		fields: [events.typeId],
		references: [tags.id],
		relationName: "events_typeId_tags_id"
	}),
	type: one(tags, {
		fields: [events.typeId],
		references: [tags.id],
		relationName: "events_typeId_tags_id"
	}),
	responsible: one(users, {
		fields: [events.responsibleId],
		references: [users.id]
	}),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
	tag_categoryId: one(tags, {
		fields: [expenses.categoryId],
		references: [tags.id],
		relationName: "expenses_categoryId_tags_id"
	}),
	user: one(users, {
		fields: [expenses.createdById],
		references: [users.id]
	}),
	tag_resultId: one(tags, {
		fields: [expenses.resultId],
		references: [tags.id],
		relationName: "expenses_resultId_tags_id"
	}),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
	folder: one(folders, {
		fields: [files.folderId],
		references: [folders.id]
	}),
	user: one(users, {
		fields: [files.userId],
		references: [users.id]
	}),
	filesLinks: many(filesLinks),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	files: many(files),
	folder: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "folders_parentId_folders_id"
	}),
	folders: many(folders, {
		relationName: "folders_parentId_folders_id"
	}),
	user: one(users, {
		fields: [folders.userId],
		references: [users.id]
	}),
}));

export const filesLinksRelations = relations(filesLinks, ({ one }) => ({
	area: one(areas, {
		fields: [filesLinks.areaId],
		references: [areas.id]
	}),
	file: one(files, {
		fields: [filesLinks.fileId],
		references: [files.id]
	}),
	approval: one(approvals, {
		fields: [filesLinks.fileableId],
		references: [approvals.id]
	}),
}));

export const holidaysRelations = relations(holidays, ({ one }) => ({
	approver: one(users, {
		fields: [holidays.approverId],
		references: [users.id]
	}),
	employee: one(employees, {
		fields: [holidays.employeeId],
		references: [employees.id]
	}),
	status: one(tags, {
		fields: [holidays.statusId],
		references: [tags.id],
		relationName: "holidays_statusId_tags_id"
	}),
	type: one(tags, {
		fields: [holidays.typeId],
		references: [tags.id],
		relationName: "holidays_typeId_tags_id"
	}),
}));

export const incomesRelations = relations(incomes, ({ one }) => ({
	tag_categoryId: one(tags, {
		fields: [incomes.categoryId],
		references: [tags.id],
		relationName: "incomes_categoryId_tags_id"
	}),
	user: one(users, {
		fields: [incomes.createdById],
		references: [users.id]
	}),
	tag_resultId: one(tags, {
		fields: [incomes.resultId],
		references: [tags.id],
		relationName: "incomes_resultId_tags_id"
	}),
	tag_typeId: one(tags, {
		fields: [incomes.typeId],
		references: [tags.id],
		relationName: "incomes_typeId_tags_id"
	}),
}));

export const inductionsRelations = relations(inductions, ({ one }) => ({
	confirmation: one(tags, {
		fields: [inductions.confirmationId],
		references: [tags.id],
		relationName: "inductions_confirmationId_tags_id"
	}),
	employee: one(employees, {
		fields: [inductions.employeeId],
		references: [employees.id]
	}),
	responsible: one(users, {
		fields: [inductions.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [inductions.statusId],
		references: [tags.id],
		relationName: "inductions_statusId_tags_id"
	}),
	typeBond: one(tags, {
		fields: [inductions.typeBondId],
		references: [tags.id],
		relationName: "inductions_typeBondId_tags_id"
	}),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
	applicant: one(applicants, {
		fields: [interviews.applicantId],
		references: [applicants.id]
	}),
	interviewer: one(users, {
		fields: [interviews.interviewerId],
		references: [users.id]
	}),
	interviewType: one(tags, {
		fields: [interviews.interviewTypeId],
		references: [tags.id],
		relationName: "interviews_interviewTypeId_tags_id"
	}),
	result: one(tags, {
		fields: [interviews.resultId],
		references: [tags.id],
		relationName: "interviews_resultId_tags_id"
	}),
	status: one(tags, {
		fields: [interviews.statusId],
		references: [tags.id],
		relationName: "interviews_statusId_tags_id"
	}),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
	contact: one(contacts, {
		fields: [invoices.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [invoices.createdById],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [invoices.statusId],
		references: [tags.id]
	}),
}));

export const kitsRelations = relations(kits, ({ one }) => ({
	deliveryResponsibleUser: one(users, {
		fields: [kits.deliveryResponsibleUserId],
		references: [users.id],
		relationName: "kits_deliveryResponsibleUserId_users_id"
	}),
	requestedByUser: one(users, {
		fields: [kits.requestedByUserId],
		references: [users.id],
		relationName: "kits_requestedByUserId_users_id"
	}),
	status: one(tags, {
		fields: [kits.statusId],
		references: [tags.id]
	}),
}));

export const kpiRecordsRelations = relations(kpiRecords, ({ one }) => ({
	user: one(users, {
		fields: [kpiRecords.createdById],
		references: [users.id]
	}),
	kpi: one(kpis, {
		fields: [kpiRecords.kpiId],
		references: [kpis.id]
	}),
}));

export const kpisRelations = relations(kpis, ({ one, many }) => ({
	kpiRecords: many(kpiRecords),
	role: one(roles, {
		fields: [kpis.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
	kpis: many(kpis),
	modelHasRoles: many(modelHasRoles),
	userRoles: many(userRoles),
	roleHasPermissions: many(roleHasPermissions),
}));

export const licenseStatusUpdatesRelations = relations(licenseStatusUpdates, ({ one }) => ({
	user_createdBy: one(users, {
		fields: [licenseStatusUpdates.createdBy],
		references: [users.id],
		relationName: "licenseStatusUpdates_createdBy_users_id"
	}),
	license: one(licenses, {
		fields: [licenseStatusUpdates.licenseId],
		references: [licenses.id]
	}),
	user_responsibleId: one(users, {
		fields: [licenseStatusUpdates.responsibleId],
		references: [users.id],
		relationName: "licenseStatusUpdates_responsibleId_users_id"
	}),
	tag: one(tags, {
		fields: [licenseStatusUpdates.statusId],
		references: [tags.id]
	}),
}));

export const licensesRelations = relations(licenses, ({ one, many }) => ({
	licenseStatusUpdates: many(licenseStatusUpdates),
	licenseType: one(tags, {
		fields: [licenses.licenseTypeId],
		references: [tags.id],
		relationName: "licenses_licenseTypeId_tags_id"
	}),
	project: one(projects, {
		fields: [licenses.projectId],
		references: [projects.id]
	}),
	status: one(tags, {
		fields: [licenses.statusId],
		references: [tags.id],
		relationName: "licenses_statusId_tags_id"
	}),
}));

export const meetingResponsiblesRelations = relations(meetingResponsibles, ({ one }) => ({
	meeting: one(meetings, {
		fields: [meetingResponsibles.meetingId],
		references: [meetings.id]
	}),
	user: one(users, {
		fields: [meetingResponsibles.userId],
		references: [users.id]
	}),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
	meetingResponsibles: many(meetingResponsibles),
	tag: one(tags, {
		fields: [meetings.statusId],
		references: [tags.id]
	}),
	team: one(teams, {
		fields: [meetings.teamId],
		references: [teams.id]
	}),
}));

export const messageMentionsRelations = relations(messageMentions, ({ one }) => ({
	message: one(messages, {
		fields: [messageMentions.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageMentions.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
	messageMentions: many(messageMentions),
	messageReactions: many(messageReactions),
	teamChannel: one(teamChannels, {
		fields: [messages.channelId],
		references: [teamChannels.id]
	}),
	message: one(messages, {
		fields: [messages.parentId],
		references: [messages.id],
		relationName: "messages_parentId_messages_id"
	}),
	messages: many(messages, {
		relationName: "messages_parentId_messages_id"
	}),
	privateChat: one(privateChats, {
		fields: [messages.privateChatId],
		references: [privateChats.id]
	}),
	user: one(users, {
		fields: [messages.userId],
		references: [users.id]
	}),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
	message: one(messages, {
		fields: [messageReactions.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageReactions.userId],
		references: [users.id]
	}),
}));

export const privateChatsRelations = relations(privateChats, ({ many }) => ({
	messages: many(messages),
	privateChatUsers: many(privateChatUser),
}));

export const modelHasPermissionsRelations = relations(modelHasPermissions, ({ one }) => ({
	permission: one(permissions, {
		fields: [modelHasPermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
	modelHasPermissions: many(modelHasPermissions),
	area: one(areas, {
		fields: [permissions.areaId],
		references: [areas.id]
	}),
	roleHasPermissions: many(roleHasPermissions),
}));

export const modelHasRolesRelations = relations(modelHasRoles, ({ one }) => ({
	role: one(roles, {
		fields: [modelHasRoles.roleId],
		references: [roles.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));



export const normsRelations = relations(norms, ({ one }) => ({
	user: one(users, {
		fields: [norms.userId],
		references: [users.id]
	}),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({ one, many }) => ({
	user: one(users, {
		fields: [notificationTemplates.userId],
		references: [users.id]
	}),
	notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	notificationTemplate: one(notificationTemplates, {
		fields: [notifications.templateId],
		references: [notificationTemplates.id]
	}),
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const oauthConnectionsRelations = relations(oauthConnections, ({ one }) => ({
	user: one(users, {
		fields: [oauthConnections.userId],
		references: [users.id]
	}),
}));

export const offBoardingTasksRelations = relations(offBoardingTasks, ({ one }) => ({
	completedBy: one(users, {
		fields: [offBoardingTasks.completedBy],
		references: [users.id]
	}),
	offBoarding: one(offBoardings, {
		fields: [offBoardingTasks.offBoardingId],
		references: [offBoardings.id]
	}),
	team: one(teams, {
		fields: [offBoardingTasks.teamId],
		references: [teams.id]
	}),
}));

export const offBoardingsRelations = relations(offBoardings, ({ one, many }) => ({
	tasks: many(offBoardingTasks),
	employee: one(employees, {
		fields: [offBoardings.employeeId],
		references: [employees.id]
	}),
	project: one(projects, {
		fields: [offBoardings.projectId],
		references: [projects.id]
	}),
	responsible: one(users, {
		fields: [offBoardings.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [offBoardings.statusId],
		references: [tags.id]
	}),
}));

export const payrollsRelations = relations(payrolls, ({ one }) => ({
	employee: one(employees, {
		fields: [payrolls.employeeId],
		references: [employees.id]
	}),
	status: one(tags, {
		fields: [payrolls.statusId],
		references: [tags.id],
		relationName: "payrolls_statusId_tags_id"
	}),
}));

export const policiesRelations = relations(policies, ({ one }) => ({
	assignedTo: one(users, {
		fields: [policies.assignedToId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [policies.statusId],
		references: [tags.id],
		relationName: "policies_statusId_tags_id"
	}),
	type: one(tags, {
		fields: [policies.typeId],
		references: [tags.id],
		relationName: "policies_typeId_tags_id"
	}),
}));

export const privateChatUserRelations = relations(privateChatUser, ({ one }) => ({
	privateChat: one(privateChats, {
		fields: [privateChatUser.privateChatId],
		references: [privateChats.id]
	}),
	user: one(users, {
		fields: [privateChatUser.userId],
		references: [users.id]
	}),
}));

export const stagesRelations = relations(stages, ({ many }) => ({
	projects: many(projects),
}));

export const punchItemsRelations = relations(punchItems, ({ one }) => ({
	responsible: one(users, {
		fields: [punchItems.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [punchItems.statusId],
		references: [tags.id],
		relationName: "punchItems_statusId_tags_id"
	}),
	worksite: one(worksites, {
		fields: [punchItems.worksiteId],
		references: [worksites.id]
	}),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
	contact: one(contacts, {
		fields: [quotes.contactId],
		references: [contacts.id]
	}),
	tag: one(tags, {
		fields: [quotes.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [quotes.userId],
		references: [users.id]
	}),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
	tag: one(tags, {
		fields: [reports.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [reports.userId],
		references: [users.id]
	}),
}));

export const roleHasPermissionsRelations = relations(roleHasPermissions, ({ one }) => ({
	permission: one(permissions, {
		fields: [roleHasPermissions.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [roleHasPermissions.roleId],
		references: [roles.id]
	}),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
	team: one(teams, {
		fields: [shares.sharedWithTeamId],
		references: [teams.id]
	}),
	user_sharedWithUserId: one(users, {
		fields: [shares.sharedWithUserId],
		references: [users.id],
		relationName: "shares_sharedWithUserId_users_id"
	}),
	user_userId: one(users, {
		fields: [shares.userId],
		references: [users.id],
		relationName: "shares_userId_users_id"
	}),
}));

export const socialMediaPostsRelations = relations(socialMediaPosts, ({ one }) => ({
	project: one(projects, {
		fields: [socialMediaPosts.projectId],
		references: [projects.id]
	}),
	responsible: one(users, {
		fields: [socialMediaPosts.responsibleId],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [socialMediaPosts.statusId],
		references: [tags.id]
	}),
}));

export const subsRelations = relations(subs, ({ one }) => ({
	tag_frequencyId: one(tags, {
		fields: [subs.frequencyId],
		references: [tags.id],
		relationName: "subs_frequencyId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [subs.statusId],
		references: [tags.id],
		relationName: "subs_statusId_tags_id"
	}),
	user: one(users, {
		fields: [subs.userId],
		references: [users.id]
	}),
}));

export const tagCategoriesRelations = relations(tagCategories, ({ many }) => ({
	tags: many(tags),
}));

export const taskUserRelations = relations(taskUser, ({ one }) => ({
	task: one(tasks, {
		fields: [taskUser.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskUser.userId],
		references: [users.id]
	}),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	taskUsers: many(taskUser),
	bucket: one(buckets, {
		fields: [tasks.bucketId],
		references: [buckets.id]
	}),
	user: one(users, {
		fields: [tasks.createdBy],
		references: [users.id]
	}),
	// tag_priorityId: one(tags, {
	// 	fields: [tasks.priorityId],
	// 	references: [tags.id],
	// 	relationName: "tasks_priorityId_tags_id"
	// }),
	// tag_statusId: one(tags, {
	// 	fields: [tasks.statusId],
	// 	references: [tags.id],
	// 	relationName: "tasks_statusId_tags_id"
	// }),
}));

export const taxRecordsRelations = relations(taxRecords, ({ one, many }) => ({
	tag_statusId: one(tags, {
		fields: [taxRecords.statusId],
		references: [tags.id],
		relationName: "taxRecords_statusId_tags_id"
	}),
	tag_typeId: one(tags, {
		fields: [taxRecords.typeId],
		references: [tags.id],
		relationName: "taxRecords_typeId_tags_id"
	}),
	filesLinks: many(filesLinks),
}));

export const teamUserRelations = relations(teamUser, ({ one }) => ({
	teamRole: one(teamRoles, {
		fields: [teamUser.roleId],
		references: [teamRoles.id]
	}),
	team: one(teams, {
		fields: [teamUser.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamUser.userId],
		references: [users.id]
	}),
}));

export const teamRolesRelations = relations(teamRoles, ({ many }) => ({
	teamUsers: many(teamUser),
}));

export const visitsRelations = relations(visits, ({ one }) => ({
	visitor: one(users, {
		fields: [visits.performedBy],
		references: [users.id]
	}),
	status: one(tags, {
		fields: [visits.statusId],
		references: [tags.id]
	}),
	worksite: one(worksites, {
		fields: [visits.worksiteId],
		references: [worksites.id]
	}),
}));

export const volunteersRelations = relations(volunteers, ({ one }) => ({
	campaign: one(campaigns, {
		fields: [volunteers.campaignId],
		references: [campaigns.id]
	}),
	status: one(tags, {
		fields: [volunteers.statusId],
		references: [tags.id]
	}),
}));




