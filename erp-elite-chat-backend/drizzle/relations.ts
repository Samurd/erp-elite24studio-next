import { relations } from "drizzle-orm/relations";
import { tagCategories, tags, adpieces, projects, teams, strategies, contacts, stages, users, alliances, vacancies, applicants, approvals, approvers, campaigns, apuCampaigns, areas, employees, departments, attendances, audits, birthdays, plans, buckets, calendarEvents, caseMarketings, caseRecords, certificates, worksites, changes, teamChannels, channelUser, contracts, donations, events, eventItems, expenses, folders, files, filesLinks, holidays, incomes, inductions, interviews, invoices, kits, roles, kpis, kpiRecords, licenses, licenseStatusUpdates, meetings, meetingResponsibles, messages, privateChats, messageMentions, messageReactions, permissions, norms, notificationTemplates, notifications, oauthConnections, offBoardings, offBoardingTasks, payrolls, policies, privateChatUser, punchItems, quotes, reports, shares, socialMediaPosts, subs, tasks, taskUser, taxRecords, teamUser, teamRoles, visits, volunteers, roleHasPermissions, userRoles, modelHasPermissions, modelHasRoles } from "./schema";

export const tagsRelations = relations(tags, ({one, many}) => ({
	tagCategory: one(tagCategories, {
		fields: [tags.categoryId],
		references: [tagCategories.id]
	}),
	adpieces_typeId: many(adpieces, {
		relationName: "adpieces_typeId_tags_id"
	}),
	adpieces_statusId: many(adpieces, {
		relationName: "adpieces_statusId_tags_id"
	}),
	projects_statusId: many(projects, {
		relationName: "projects_statusId_tags_id"
	}),
	projects_projectTypeId: many(projects, {
		relationName: "projects_projectTypeId_tags_id"
	}),
	strategies: many(strategies),
	alliances: many(alliances),
	vacancies_contractTypeId: many(vacancies, {
		relationName: "vacancies_contractTypeId_tags_id"
	}),
	vacancies_statusId: many(vacancies, {
		relationName: "vacancies_statusId_tags_id"
	}),
	applicants: many(applicants),
	approvals_statusId: many(approvals, {
		relationName: "approvals_statusId_tags_id"
	}),
	approvals_priorityId: many(approvals, {
		relationName: "approvals_priorityId_tags_id"
	}),
	approvers: many(approvers),
	campaigns: many(campaigns),
	apuCampaigns: many(apuCampaigns),
	employees_genderId: many(employees, {
		relationName: "employees_genderId_tags_id"
	}),
	employees_educationTypeId: many(employees, {
		relationName: "employees_educationTypeId_tags_id"
	}),
	employees_maritalStatusId: many(employees, {
		relationName: "employees_maritalStatusId_tags_id"
	}),
	attendances_statusId: many(attendances, {
		relationName: "attendances_statusId_tags_id"
	}),
	attendances_modalityId: many(attendances, {
		relationName: "attendances_modalityId_tags_id"
	}),
	audits_typeId: many(audits, {
		relationName: "audits_typeId_tags_id"
	}),
	audits_statusId: many(audits, {
		relationName: "audits_statusId_tags_id"
	}),
	contacts_contactTypeId: many(contacts, {
		relationName: "contacts_contactTypeId_tags_id"
	}),
	contacts_statusId: many(contacts, {
		relationName: "contacts_statusId_tags_id"
	}),
	contacts_relationTypeId: many(contacts, {
		relationName: "contacts_relationTypeId_tags_id"
	}),
	contacts_sourceId: many(contacts, {
		relationName: "contacts_sourceId_tags_id"
	}),
	contacts_labelId: many(contacts, {
		relationName: "contacts_labelId_tags_id"
	}),
	caseMarketings_typeId: many(caseMarketings, {
		relationName: "caseMarketings_typeId_tags_id"
	}),
	caseMarketings_statusId: many(caseMarketings, {
		relationName: "caseMarketings_statusId_tags_id"
	}),
	caseRecords_statusId: many(caseRecords, {
		relationName: "caseRecords_statusId_tags_id"
	}),
	caseRecords_caseTypeId: many(caseRecords, {
		relationName: "caseRecords_caseTypeId_tags_id"
	}),
	certificates_typeId: many(certificates, {
		relationName: "certificates_typeId_tags_id"
	}),
	certificates_statusId: many(certificates, {
		relationName: "certificates_statusId_tags_id"
	}),
	worksites_typeId: many(worksites, {
		relationName: "worksites_typeId_tags_id"
	}),
	worksites_statusId: many(worksites, {
		relationName: "worksites_statusId_tags_id"
	}),
	changes_changeTypeId: many(changes, {
		relationName: "changes_changeTypeId_tags_id"
	}),
	changes_budgetImpactId: many(changes, {
		relationName: "changes_budgetImpactId_tags_id"
	}),
	changes_statusId: many(changes, {
		relationName: "changes_statusId_tags_id"
	}),
	contracts_typeId: many(contracts, {
		relationName: "contracts_typeId_tags_id"
	}),
	contracts_categoryId: many(contracts, {
		relationName: "contracts_categoryId_tags_id"
	}),
	contracts_statusId: many(contracts, {
		relationName: "contracts_statusId_tags_id"
	}),
	contracts_scheduleId: many(contracts, {
		relationName: "contracts_scheduleId_tags_id"
	}),
	events_typeId: many(events, {
		relationName: "events_typeId_tags_id"
	}),
	events_statusId: many(events, {
		relationName: "events_statusId_tags_id"
	}),
	eventItems: many(eventItems),
	expenses_categoryId: many(expenses, {
		relationName: "expenses_categoryId_tags_id"
	}),
	expenses_resultId: many(expenses, {
		relationName: "expenses_resultId_tags_id"
	}),
	holidays_typeId: many(holidays, {
		relationName: "holidays_typeId_tags_id"
	}),
	holidays_statusId: many(holidays, {
		relationName: "holidays_statusId_tags_id"
	}),
	incomes_typeId: many(incomes, {
		relationName: "incomes_typeId_tags_id"
	}),
	incomes_categoryId: many(incomes, {
		relationName: "incomes_categoryId_tags_id"
	}),
	incomes_resultId: many(incomes, {
		relationName: "incomes_resultId_tags_id"
	}),
	inductions_typeBondId: many(inductions, {
		relationName: "inductions_typeBondId_tags_id"
	}),
	inductions_statusId: many(inductions, {
		relationName: "inductions_statusId_tags_id"
	}),
	inductions_confirmationId: many(inductions, {
		relationName: "inductions_confirmationId_tags_id"
	}),
	interviews_interviewTypeId: many(interviews, {
		relationName: "interviews_interviewTypeId_tags_id"
	}),
	interviews_statusId: many(interviews, {
		relationName: "interviews_statusId_tags_id"
	}),
	interviews_resultId: many(interviews, {
		relationName: "interviews_resultId_tags_id"
	}),
	invoices: many(invoices),
	kits: many(kits),
	licenses_licenseTypeId: many(licenses, {
		relationName: "licenses_licenseTypeId_tags_id"
	}),
	licenses_statusId: many(licenses, {
		relationName: "licenses_statusId_tags_id"
	}),
	licenseStatusUpdates: many(licenseStatusUpdates),
	meetings: many(meetings),
	offBoardings: many(offBoardings),
	payrolls: many(payrolls),
	policies_typeId: many(policies, {
		relationName: "policies_typeId_tags_id"
	}),
	policies_statusId: many(policies, {
		relationName: "policies_statusId_tags_id"
	}),
	punchItems: many(punchItems),
	quotes: many(quotes),
	reports: many(reports),
	socialMediaPosts: many(socialMediaPosts),
	subs_frequencyId: many(subs, {
		relationName: "subs_frequencyId_tags_id"
	}),
	subs_statusId: many(subs, {
		relationName: "subs_statusId_tags_id"
	}),
	tasks_statusId: many(tasks, {
		relationName: "tasks_statusId_tags_id"
	}),
	tasks_priorityId: many(tasks, {
		relationName: "tasks_priorityId_tags_id"
	}),
	taxRecords_typeId: many(taxRecords, {
		relationName: "taxRecords_typeId_tags_id"
	}),
	taxRecords_statusId: many(taxRecords, {
		relationName: "taxRecords_statusId_tags_id"
	}),
	visits: many(visits),
	volunteers: many(volunteers),
}));

export const tagCategoriesRelations = relations(tagCategories, ({many}) => ({
	tags: many(tags),
}));

export const adpiecesRelations = relations(adpieces, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [adpieces.typeId],
		references: [tags.id],
		relationName: "adpieces_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [adpieces.statusId],
		references: [tags.id],
		relationName: "adpieces_statusId_tags_id"
	}),
	project: one(projects, {
		fields: [adpieces.projectId],
		references: [projects.id]
	}),
	team: one(teams, {
		fields: [adpieces.teamId],
		references: [teams.id]
	}),
	strategy: one(strategies, {
		fields: [adpieces.strategyId],
		references: [strategies.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	adpieces: many(adpieces),
	contact: one(contacts, {
		fields: [projects.contactId],
		references: [contacts.id]
	}),
	tag_statusId: one(tags, {
		fields: [projects.statusId],
		references: [tags.id],
		relationName: "projects_statusId_tags_id"
	}),
	tag_projectTypeId: one(tags, {
		fields: [projects.projectTypeId],
		references: [tags.id],
		relationName: "projects_projectTypeId_tags_id"
	}),
	stage: one(stages, {
		fields: [projects.currentStageId],
		references: [stages.id]
	}),
	user: one(users, {
		fields: [projects.responsibleId],
		references: [users.id]
	}),
	team: one(teams, {
		fields: [projects.teamId],
		references: [teams.id]
	}),
	plans: many(plans),
	caseMarketings: many(caseMarketings),
	worksites: many(worksites),
	licenses: many(licenses),
	offBoardings: many(offBoardings),
	socialMediaPosts: many(socialMediaPosts),
}));

export const teamsRelations = relations(teams, ({many}) => ({
	adpieces: many(adpieces),
	projects: many(projects),
	plans: many(plans),
	teamChannels: many(teamChannels),
	meetings: many(meetings),
	offBoardingTasks: many(offBoardingTasks),
	shares: many(shares),
	teamUsers: many(teamUser),
}));

export const strategiesRelations = relations(strategies, ({one, many}) => ({
	adpieces: many(adpieces),
	tag: one(tags, {
		fields: [strategies.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [strategies.responsibleId],
		references: [users.id]
	}),
}));

export const contactsRelations = relations(contacts, ({one, many}) => ({
	projects: many(projects),
	birthdays: many(birthdays),
	tag_contactTypeId: one(tags, {
		fields: [contacts.contactTypeId],
		references: [tags.id],
		relationName: "contacts_contactTypeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [contacts.statusId],
		references: [tags.id],
		relationName: "contacts_statusId_tags_id"
	}),
	tag_relationTypeId: one(tags, {
		fields: [contacts.relationTypeId],
		references: [tags.id],
		relationName: "contacts_relationTypeId_tags_id"
	}),
	tag_sourceId: one(tags, {
		fields: [contacts.sourceId],
		references: [tags.id],
		relationName: "contacts_sourceId_tags_id"
	}),
	tag_labelId: one(tags, {
		fields: [contacts.labelId],
		references: [tags.id],
		relationName: "contacts_labelId_tags_id"
	}),
	user: one(users, {
		fields: [contacts.responsibleId],
		references: [users.id]
	}),
	caseRecords: many(caseRecords),
	invoices: many(invoices),
	quotes: many(quotes),
}));

export const stagesRelations = relations(stages, ({many}) => ({
	projects: many(projects),
}));

export const usersRelations = relations(users, ({many}) => ({
	projects: many(projects),
	strategies: many(strategies),
	vacancies: many(vacancies),
	approvals: many(approvals),
	approvers: many(approvers),
	campaigns: many(campaigns),
	birthdays: many(birthdays),
	contacts: many(contacts),
	plans: many(plans),
	calendarEvents: many(calendarEvents),
	caseMarketings: many(caseMarketings),
	caseRecords: many(caseRecords),
	certificates: many(certificates),
	worksites: many(worksites),
	changes: many(changes),
	channelUsers: many(channelUser),
	contracts: many(contracts),
	events: many(events),
	expenses: many(expenses),
	folders: many(folders),
	files: many(files),
	holidays: many(holidays),
	incomes: many(incomes),
	inductions: many(inductions),
	interviews: many(interviews),
	invoices: many(invoices),
	kits_requestedByUserId: many(kits, {
		relationName: "kits_requestedByUserId_users_id"
	}),
	kits_deliveryResponsibleUserId: many(kits, {
		relationName: "kits_deliveryResponsibleUserId_users_id"
	}),
	kpiRecords: many(kpiRecords),
	licenseStatusUpdates_responsibleId: many(licenseStatusUpdates, {
		relationName: "licenseStatusUpdates_responsibleId_users_id"
	}),
	licenseStatusUpdates_createdBy: many(licenseStatusUpdates, {
		relationName: "licenseStatusUpdates_createdBy_users_id"
	}),
	meetingResponsibles: many(meetingResponsibles),
	messages: many(messages),
	messageMentions: many(messageMentions),
	messageReactions: many(messageReactions),
	norms: many(norms),
	notificationTemplates: many(notificationTemplates),
	notifications: many(notifications),
	oauthConnections: many(oauthConnections),
	offBoardings: many(offBoardings),
	offBoardingTasks: many(offBoardingTasks),
	policies: many(policies),
	privateChatUsers: many(privateChatUser),
	punchItems: many(punchItems),
	quotes: many(quotes),
	reports: many(reports),
	shares_userId: many(shares, {
		relationName: "shares_userId_users_id"
	}),
	shares_sharedWithUserId: many(shares, {
		relationName: "shares_sharedWithUserId_users_id"
	}),
	socialMediaPosts: many(socialMediaPosts),
	subs: many(subs),
	tasks: many(tasks),
	taskUsers: many(taskUser),
	teamUsers: many(teamUser),
	visits: many(visits),
	userRoles: many(userRoles),
}));

export const alliancesRelations = relations(alliances, ({one}) => ({
	tag: one(tags, {
		fields: [alliances.typeId],
		references: [tags.id]
	}),
}));

export const vacanciesRelations = relations(vacancies, ({one, many}) => ({
	tag_contractTypeId: one(tags, {
		fields: [vacancies.contractTypeId],
		references: [tags.id],
		relationName: "vacancies_contractTypeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [vacancies.statusId],
		references: [tags.id],
		relationName: "vacancies_statusId_tags_id"
	}),
	user: one(users, {
		fields: [vacancies.userId],
		references: [users.id]
	}),
	applicants: many(applicants),
}));

export const applicantsRelations = relations(applicants, ({one, many}) => ({
	vacancy: one(vacancies, {
		fields: [applicants.vacancyId],
		references: [vacancies.id]
	}),
	tag: one(tags, {
		fields: [applicants.statusId],
		references: [tags.id]
	}),
	interviews: many(interviews),
}));

export const approvalsRelations = relations(approvals, ({one, many}) => ({
	tag_statusId: one(tags, {
		fields: [approvals.statusId],
		references: [tags.id],
		relationName: "approvals_statusId_tags_id"
	}),
	tag_priorityId: one(tags, {
		fields: [approvals.priorityId],
		references: [tags.id],
		relationName: "approvals_priorityId_tags_id"
	}),
	user: one(users, {
		fields: [approvals.createdById],
		references: [users.id]
	}),
	approvers: many(approvers),
}));

export const approversRelations = relations(approvers, ({one}) => ({
	approval: one(approvals, {
		fields: [approvers.approvalId],
		references: [approvals.id]
	}),
	user: one(users, {
		fields: [approvers.userId],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [approvers.statusId],
		references: [tags.id]
	}),
}));

export const campaignsRelations = relations(campaigns, ({one, many}) => ({
	user: one(users, {
		fields: [campaigns.responsibleId],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [campaigns.statusId],
		references: [tags.id]
	}),
	apuCampaigns: many(apuCampaigns),
	donations: many(donations),
	volunteers: many(volunteers),
}));

export const apuCampaignsRelations = relations(apuCampaigns, ({one}) => ({
	campaign: one(campaigns, {
		fields: [apuCampaigns.campaignId],
		references: [campaigns.id]
	}),
	tag: one(tags, {
		fields: [apuCampaigns.unitId],
		references: [tags.id]
	}),
}));

export const areasRelations = relations(areas, ({one, many}) => ({
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

export const employeesRelations = relations(employees, ({one, many}) => ({
	tag_genderId: one(tags, {
		fields: [employees.genderId],
		references: [tags.id],
		relationName: "employees_genderId_tags_id"
	}),
	tag_educationTypeId: one(tags, {
		fields: [employees.educationTypeId],
		references: [tags.id],
		relationName: "employees_educationTypeId_tags_id"
	}),
	tag_maritalStatusId: one(tags, {
		fields: [employees.maritalStatusId],
		references: [tags.id],
		relationName: "employees_maritalStatusId_tags_id"
	}),
	department: one(departments, {
		fields: [employees.departmentId],
		references: [departments.id]
	}),
	attendances: many(attendances),
	birthdays: many(birthdays),
	contracts: many(contracts),
	holidays: many(holidays),
	inductions: many(inductions),
	offBoardings: many(offBoardings),
	payrolls: many(payrolls),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	employees: many(employees),
	department: one(departments, {
		fields: [departments.parentId],
		references: [departments.id],
		relationName: "departments_parentId_departments_id"
	}),
	departments: many(departments, {
		relationName: "departments_parentId_departments_id"
	}),
}));

export const attendancesRelations = relations(attendances, ({one}) => ({
	employee: one(employees, {
		fields: [attendances.employeeId],
		references: [employees.id]
	}),
	tag_statusId: one(tags, {
		fields: [attendances.statusId],
		references: [tags.id],
		relationName: "attendances_statusId_tags_id"
	}),
	tag_modalityId: one(tags, {
		fields: [attendances.modalityId],
		references: [tags.id],
		relationName: "attendances_modalityId_tags_id"
	}),
}));

export const auditsRelations = relations(audits, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [audits.typeId],
		references: [tags.id],
		relationName: "audits_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [audits.statusId],
		references: [tags.id],
		relationName: "audits_statusId_tags_id"
	}),
}));

export const birthdaysRelations = relations(birthdays, ({one}) => ({
	employee: one(employees, {
		fields: [birthdays.employeeId],
		references: [employees.id]
	}),
	contact: one(contacts, {
		fields: [birthdays.contactId],
		references: [contacts.id]
	}),
	user: one(users, {
		fields: [birthdays.responsibleId],
		references: [users.id]
	}),
}));

export const plansRelations = relations(plans, ({one, many}) => ({
	project: one(projects, {
		fields: [plans.projectId],
		references: [projects.id]
	}),
	team: one(teams, {
		fields: [plans.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [plans.ownerId],
		references: [users.id]
	}),
	buckets: many(buckets),
}));

export const bucketsRelations = relations(buckets, ({one, many}) => ({
	plan: one(plans, {
		fields: [buckets.planId],
		references: [plans.id]
	}),
	tasks: many(tasks),
}));

export const calendarEventsRelations = relations(calendarEvents, ({one}) => ({
	user: one(users, {
		fields: [calendarEvents.userId],
		references: [users.id]
	}),
}));

export const caseMarketingsRelations = relations(caseMarketings, ({one}) => ({
	project: one(projects, {
		fields: [caseMarketings.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [caseMarketings.responsibleId],
		references: [users.id]
	}),
	tag_typeId: one(tags, {
		fields: [caseMarketings.typeId],
		references: [tags.id],
		relationName: "caseMarketings_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [caseMarketings.statusId],
		references: [tags.id],
		relationName: "caseMarketings_statusId_tags_id"
	}),
}));

export const caseRecordsRelations = relations(caseRecords, ({one}) => ({
	contact: one(contacts, {
		fields: [caseRecords.contactId],
		references: [contacts.id]
	}),
	tag_statusId: one(tags, {
		fields: [caseRecords.statusId],
		references: [tags.id],
		relationName: "caseRecords_statusId_tags_id"
	}),
	tag_caseTypeId: one(tags, {
		fields: [caseRecords.caseTypeId],
		references: [tags.id],
		relationName: "caseRecords_caseTypeId_tags_id"
	}),
	user: one(users, {
		fields: [caseRecords.assignedToId],
		references: [users.id]
	}),
}));

export const certificatesRelations = relations(certificates, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [certificates.typeId],
		references: [tags.id],
		relationName: "certificates_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [certificates.statusId],
		references: [tags.id],
		relationName: "certificates_statusId_tags_id"
	}),
	user: one(users, {
		fields: [certificates.assignedToId],
		references: [users.id]
	}),
}));

export const worksitesRelations = relations(worksites, ({one, many}) => ({
	project: one(projects, {
		fields: [worksites.projectId],
		references: [projects.id]
	}),
	tag_typeId: one(tags, {
		fields: [worksites.typeId],
		references: [tags.id],
		relationName: "worksites_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [worksites.statusId],
		references: [tags.id],
		relationName: "worksites_statusId_tags_id"
	}),
	user: one(users, {
		fields: [worksites.responsibleId],
		references: [users.id]
	}),
	changes: many(changes),
	punchItems: many(punchItems),
	visits: many(visits),
}));

export const changesRelations = relations(changes, ({one}) => ({
	worksite: one(worksites, {
		fields: [changes.worksiteId],
		references: [worksites.id]
	}),
	tag_changeTypeId: one(tags, {
		fields: [changes.changeTypeId],
		references: [tags.id],
		relationName: "changes_changeTypeId_tags_id"
	}),
	tag_budgetImpactId: one(tags, {
		fields: [changes.budgetImpactId],
		references: [tags.id],
		relationName: "changes_budgetImpactId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [changes.statusId],
		references: [tags.id],
		relationName: "changes_statusId_tags_id"
	}),
	user: one(users, {
		fields: [changes.approvedBy],
		references: [users.id]
	}),
}));

export const teamChannelsRelations = relations(teamChannels, ({one, many}) => ({
	team: one(teams, {
		fields: [teamChannels.teamId],
		references: [teams.id]
	}),
	teamChannel: one(teamChannels, {
		fields: [teamChannels.parentId],
		references: [teamChannels.id],
		relationName: "teamChannels_parentId_teamChannels_id"
	}),
	teamChannels: many(teamChannels, {
		relationName: "teamChannels_parentId_teamChannels_id"
	}),
	channelUsers: many(channelUser),
	messages: many(messages),
}));

export const channelUserRelations = relations(channelUser, ({one}) => ({
	teamChannel: one(teamChannels, {
		fields: [channelUser.channelId],
		references: [teamChannels.id]
	}),
	user: one(users, {
		fields: [channelUser.userId],
		references: [users.id]
	}),
}));

export const contractsRelations = relations(contracts, ({one}) => ({
	employee: one(employees, {
		fields: [contracts.employeeId],
		references: [employees.id]
	}),
	tag_typeId: one(tags, {
		fields: [contracts.typeId],
		references: [tags.id],
		relationName: "contracts_typeId_tags_id"
	}),
	tag_categoryId: one(tags, {
		fields: [contracts.categoryId],
		references: [tags.id],
		relationName: "contracts_categoryId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [contracts.statusId],
		references: [tags.id],
		relationName: "contracts_statusId_tags_id"
	}),
	tag_scheduleId: one(tags, {
		fields: [contracts.scheduleId],
		references: [tags.id],
		relationName: "contracts_scheduleId_tags_id"
	}),
	user: one(users, {
		fields: [contracts.registeredById],
		references: [users.id]
	}),
}));

export const donationsRelations = relations(donations, ({one}) => ({
	campaign: one(campaigns, {
		fields: [donations.campaignId],
		references: [campaigns.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	tag_typeId: one(tags, {
		fields: [events.typeId],
		references: [tags.id],
		relationName: "events_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [events.statusId],
		references: [tags.id],
		relationName: "events_statusId_tags_id"
	}),
	user: one(users, {
		fields: [events.responsibleId],
		references: [users.id]
	}),
	eventItems: many(eventItems),
}));

export const eventItemsRelations = relations(eventItems, ({one}) => ({
	event: one(events, {
		fields: [eventItems.eventId],
		references: [events.id]
	}),
	tag: one(tags, {
		fields: [eventItems.unitId],
		references: [tags.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	tag_categoryId: one(tags, {
		fields: [expenses.categoryId],
		references: [tags.id],
		relationName: "expenses_categoryId_tags_id"
	}),
	tag_resultId: one(tags, {
		fields: [expenses.resultId],
		references: [tags.id],
		relationName: "expenses_resultId_tags_id"
	}),
	user: one(users, {
		fields: [expenses.createdById],
		references: [users.id]
	}),
}));

export const foldersRelations = relations(folders, ({one, many}) => ({
	user: one(users, {
		fields: [folders.userId],
		references: [users.id]
	}),
	folder: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "folders_parentId_folders_id"
	}),
	folders: many(folders, {
		relationName: "folders_parentId_folders_id"
	}),
	files: many(files),
}));

export const filesRelations = relations(files, ({one, many}) => ({
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

export const filesLinksRelations = relations(filesLinks, ({one}) => ({
	area: one(areas, {
		fields: [filesLinks.areaId],
		references: [areas.id]
	}),
	file: one(files, {
		fields: [filesLinks.fileId],
		references: [files.id]
	}),
}));

export const holidaysRelations = relations(holidays, ({one}) => ({
	employee: one(employees, {
		fields: [holidays.employeeId],
		references: [employees.id]
	}),
	tag_typeId: one(tags, {
		fields: [holidays.typeId],
		references: [tags.id],
		relationName: "holidays_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [holidays.statusId],
		references: [tags.id],
		relationName: "holidays_statusId_tags_id"
	}),
	user: one(users, {
		fields: [holidays.approverId],
		references: [users.id]
	}),
}));

export const incomesRelations = relations(incomes, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [incomes.typeId],
		references: [tags.id],
		relationName: "incomes_typeId_tags_id"
	}),
	tag_categoryId: one(tags, {
		fields: [incomes.categoryId],
		references: [tags.id],
		relationName: "incomes_categoryId_tags_id"
	}),
	tag_resultId: one(tags, {
		fields: [incomes.resultId],
		references: [tags.id],
		relationName: "incomes_resultId_tags_id"
	}),
	user: one(users, {
		fields: [incomes.createdById],
		references: [users.id]
	}),
}));

export const inductionsRelations = relations(inductions, ({one}) => ({
	employee: one(employees, {
		fields: [inductions.employeeId],
		references: [employees.id]
	}),
	tag_typeBondId: one(tags, {
		fields: [inductions.typeBondId],
		references: [tags.id],
		relationName: "inductions_typeBondId_tags_id"
	}),
	user: one(users, {
		fields: [inductions.responsibleId],
		references: [users.id]
	}),
	tag_statusId: one(tags, {
		fields: [inductions.statusId],
		references: [tags.id],
		relationName: "inductions_statusId_tags_id"
	}),
	tag_confirmationId: one(tags, {
		fields: [inductions.confirmationId],
		references: [tags.id],
		relationName: "inductions_confirmationId_tags_id"
	}),
}));

export const interviewsRelations = relations(interviews, ({one}) => ({
	applicant: one(applicants, {
		fields: [interviews.applicantId],
		references: [applicants.id]
	}),
	user: one(users, {
		fields: [interviews.interviewerId],
		references: [users.id]
	}),
	tag_interviewTypeId: one(tags, {
		fields: [interviews.interviewTypeId],
		references: [tags.id],
		relationName: "interviews_interviewTypeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [interviews.statusId],
		references: [tags.id],
		relationName: "interviews_statusId_tags_id"
	}),
	tag_resultId: one(tags, {
		fields: [interviews.resultId],
		references: [tags.id],
		relationName: "interviews_resultId_tags_id"
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
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

export const kitsRelations = relations(kits, ({one}) => ({
	user_requestedByUserId: one(users, {
		fields: [kits.requestedByUserId],
		references: [users.id],
		relationName: "kits_requestedByUserId_users_id"
	}),
	tag: one(tags, {
		fields: [kits.statusId],
		references: [tags.id]
	}),
	user_deliveryResponsibleUserId: one(users, {
		fields: [kits.deliveryResponsibleUserId],
		references: [users.id],
		relationName: "kits_deliveryResponsibleUserId_users_id"
	}),
}));

export const kpisRelations = relations(kpis, ({one, many}) => ({
	role: one(roles, {
		fields: [kpis.roleId],
		references: [roles.id]
	}),
	kpiRecords: many(kpiRecords),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	kpis: many(kpis),
	roleHasPermissions: many(roleHasPermissions),
	userRoles: many(userRoles),
	modelHasRoles: many(modelHasRoles),
}));

export const kpiRecordsRelations = relations(kpiRecords, ({one}) => ({
	kpi: one(kpis, {
		fields: [kpiRecords.kpiId],
		references: [kpis.id]
	}),
	user: one(users, {
		fields: [kpiRecords.createdById],
		references: [users.id]
	}),
}));

export const licensesRelations = relations(licenses, ({one, many}) => ({
	project: one(projects, {
		fields: [licenses.projectId],
		references: [projects.id]
	}),
	tag_licenseTypeId: one(tags, {
		fields: [licenses.licenseTypeId],
		references: [tags.id],
		relationName: "licenses_licenseTypeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [licenses.statusId],
		references: [tags.id],
		relationName: "licenses_statusId_tags_id"
	}),
	licenseStatusUpdates: many(licenseStatusUpdates),
}));

export const licenseStatusUpdatesRelations = relations(licenseStatusUpdates, ({one}) => ({
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
	user_createdBy: one(users, {
		fields: [licenseStatusUpdates.createdBy],
		references: [users.id],
		relationName: "licenseStatusUpdates_createdBy_users_id"
	}),
}));

export const meetingsRelations = relations(meetings, ({one, many}) => ({
	team: one(teams, {
		fields: [meetings.teamId],
		references: [teams.id]
	}),
	tag: one(tags, {
		fields: [meetings.statusId],
		references: [tags.id]
	}),
	meetingResponsibles: many(meetingResponsibles),
}));

export const meetingResponsiblesRelations = relations(meetingResponsibles, ({one}) => ({
	meeting: one(meetings, {
		fields: [meetingResponsibles.meetingId],
		references: [meetings.id]
	}),
	user: one(users, {
		fields: [meetingResponsibles.userId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	user: one(users, {
		fields: [messages.userId],
		references: [users.id]
	}),
	teamChannel: one(teamChannels, {
		fields: [messages.channelId],
		references: [teamChannels.id]
	}),
	privateChat: one(privateChats, {
		fields: [messages.privateChatId],
		references: [privateChats.id]
	}),
	message: one(messages, {
		fields: [messages.parentId],
		references: [messages.id],
		relationName: "messages_parentId_messages_id"
	}),
	messages: many(messages, {
		relationName: "messages_parentId_messages_id"
	}),
	messageMentions: many(messageMentions),
	messageReactions: many(messageReactions),
}));

export const privateChatsRelations = relations(privateChats, ({many}) => ({
	messages: many(messages),
	privateChatUsers: many(privateChatUser),
}));

export const messageMentionsRelations = relations(messageMentions, ({one}) => ({
	message: one(messages, {
		fields: [messageMentions.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageMentions.userId],
		references: [users.id]
	}),
}));

export const messageReactionsRelations = relations(messageReactions, ({one}) => ({
	message: one(messages, {
		fields: [messageReactions.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageReactions.userId],
		references: [users.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({one, many}) => ({
	area: one(areas, {
		fields: [permissions.areaId],
		references: [areas.id]
	}),
	roleHasPermissions: many(roleHasPermissions),
	modelHasPermissions: many(modelHasPermissions),
}));

export const normsRelations = relations(norms, ({one}) => ({
	user: one(users, {
		fields: [norms.userId],
		references: [users.id]
	}),
}));

export const notificationTemplatesRelations = relations(notificationTemplates, ({one, many}) => ({
	user: one(users, {
		fields: [notificationTemplates.userId],
		references: [users.id]
	}),
	notifications: many(notifications),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	notificationTemplate: one(notificationTemplates, {
		fields: [notifications.templateId],
		references: [notificationTemplates.id]
	}),
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const oauthConnectionsRelations = relations(oauthConnections, ({one}) => ({
	user: one(users, {
		fields: [oauthConnections.userId],
		references: [users.id]
	}),
}));

export const offBoardingsRelations = relations(offBoardings, ({one, many}) => ({
	employee: one(employees, {
		fields: [offBoardings.employeeId],
		references: [employees.id]
	}),
	project: one(projects, {
		fields: [offBoardings.projectId],
		references: [projects.id]
	}),
	tag: one(tags, {
		fields: [offBoardings.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [offBoardings.responsibleId],
		references: [users.id]
	}),
	offBoardingTasks: many(offBoardingTasks),
}));

export const offBoardingTasksRelations = relations(offBoardingTasks, ({one}) => ({
	offBoarding: one(offBoardings, {
		fields: [offBoardingTasks.offBoardingId],
		references: [offBoardings.id]
	}),
	team: one(teams, {
		fields: [offBoardingTasks.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [offBoardingTasks.completedBy],
		references: [users.id]
	}),
}));

export const payrollsRelations = relations(payrolls, ({one}) => ({
	employee: one(employees, {
		fields: [payrolls.employeeId],
		references: [employees.id]
	}),
	tag: one(tags, {
		fields: [payrolls.statusId],
		references: [tags.id]
	}),
}));

export const policiesRelations = relations(policies, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [policies.typeId],
		references: [tags.id],
		relationName: "policies_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [policies.statusId],
		references: [tags.id],
		relationName: "policies_statusId_tags_id"
	}),
	user: one(users, {
		fields: [policies.assignedToId],
		references: [users.id]
	}),
}));

export const privateChatUserRelations = relations(privateChatUser, ({one}) => ({
	privateChat: one(privateChats, {
		fields: [privateChatUser.privateChatId],
		references: [privateChats.id]
	}),
	user: one(users, {
		fields: [privateChatUser.userId],
		references: [users.id]
	}),
}));

export const punchItemsRelations = relations(punchItems, ({one}) => ({
	worksite: one(worksites, {
		fields: [punchItems.worksiteId],
		references: [worksites.id]
	}),
	tag: one(tags, {
		fields: [punchItems.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [punchItems.responsibleId],
		references: [users.id]
	}),
}));

export const quotesRelations = relations(quotes, ({one}) => ({
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

export const reportsRelations = relations(reports, ({one}) => ({
	tag: one(tags, {
		fields: [reports.statusId],
		references: [tags.id]
	}),
	user: one(users, {
		fields: [reports.userId],
		references: [users.id]
	}),
}));

export const sharesRelations = relations(shares, ({one}) => ({
	user_userId: one(users, {
		fields: [shares.userId],
		references: [users.id],
		relationName: "shares_userId_users_id"
	}),
	user_sharedWithUserId: one(users, {
		fields: [shares.sharedWithUserId],
		references: [users.id],
		relationName: "shares_sharedWithUserId_users_id"
	}),
	team: one(teams, {
		fields: [shares.sharedWithTeamId],
		references: [teams.id]
	}),
}));

export const socialMediaPostsRelations = relations(socialMediaPosts, ({one}) => ({
	project: one(projects, {
		fields: [socialMediaPosts.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [socialMediaPosts.responsibleId],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [socialMediaPosts.statusId],
		references: [tags.id]
	}),
}));

export const subsRelations = relations(subs, ({one}) => ({
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

export const tasksRelations = relations(tasks, ({one, many}) => ({
	bucket: one(buckets, {
		fields: [tasks.bucketId],
		references: [buckets.id]
	}),
	tag_statusId: one(tags, {
		fields: [tasks.statusId],
		references: [tags.id],
		relationName: "tasks_statusId_tags_id"
	}),
	tag_priorityId: one(tags, {
		fields: [tasks.priorityId],
		references: [tags.id],
		relationName: "tasks_priorityId_tags_id"
	}),
	user: one(users, {
		fields: [tasks.createdBy],
		references: [users.id]
	}),
	taskUsers: many(taskUser),
}));

export const taskUserRelations = relations(taskUser, ({one}) => ({
	task: one(tasks, {
		fields: [taskUser.taskId],
		references: [tasks.id]
	}),
	user: one(users, {
		fields: [taskUser.userId],
		references: [users.id]
	}),
}));

export const taxRecordsRelations = relations(taxRecords, ({one}) => ({
	tag_typeId: one(tags, {
		fields: [taxRecords.typeId],
		references: [tags.id],
		relationName: "taxRecords_typeId_tags_id"
	}),
	tag_statusId: one(tags, {
		fields: [taxRecords.statusId],
		references: [tags.id],
		relationName: "taxRecords_statusId_tags_id"
	}),
}));

export const teamUserRelations = relations(teamUser, ({one}) => ({
	team: one(teams, {
		fields: [teamUser.teamId],
		references: [teams.id]
	}),
	user: one(users, {
		fields: [teamUser.userId],
		references: [users.id]
	}),
	teamRole: one(teamRoles, {
		fields: [teamUser.roleId],
		references: [teamRoles.id]
	}),
}));

export const teamRolesRelations = relations(teamRoles, ({many}) => ({
	teamUsers: many(teamUser),
}));

export const visitsRelations = relations(visits, ({one}) => ({
	worksite: one(worksites, {
		fields: [visits.worksiteId],
		references: [worksites.id]
	}),
	user: one(users, {
		fields: [visits.performedBy],
		references: [users.id]
	}),
	tag: one(tags, {
		fields: [visits.statusId],
		references: [tags.id]
	}),
}));

export const volunteersRelations = relations(volunteers, ({one}) => ({
	campaign: one(campaigns, {
		fields: [volunteers.campaignId],
		references: [campaigns.id]
	}),
	tag: one(tags, {
		fields: [volunteers.statusId],
		references: [tags.id]
	}),
}));

export const roleHasPermissionsRelations = relations(roleHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [roleHasPermissions.permissionId],
		references: [permissions.id]
	}),
	role: one(roles, {
		fields: [roleHasPermissions.roleId],
		references: [roles.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const modelHasPermissionsRelations = relations(modelHasPermissions, ({one}) => ({
	permission: one(permissions, {
		fields: [modelHasPermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const modelHasRolesRelations = relations(modelHasRoles, ({one}) => ({
	role: one(roles, {
		fields: [modelHasRoles.roleId],
		references: [roles.id]
	}),
}));