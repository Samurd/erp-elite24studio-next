import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, stages, contacts, tags, users, teams, filesLinks, files } from "@/drizzle/schema";
import { eq, and, like, or, gte, lte, desc, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status_filter") || "";
    const projectTypeFilter = searchParams.get("project_type_filter") || "";
    const contactFilter = searchParams.get("contact_filter") || "";
    const responsibleFilter = searchParams.get("responsible_filter") || "";
    const currentStageFilter = searchParams.get("current_stage_filter") || "";
    const dateFrom = searchParams.get("date_from") || "";
    const dateTo = searchParams.get("date_to") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "10");

    try {
        // Build where conditions
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    like(projects.name, `%${search}%`),
                    like(projects.description, `%${search}%`),
                    like(projects.direction, `%${search}%`)
                )
            );
        }

        if (statusFilter) {
            conditions.push(eq(projects.statusId, parseInt(statusFilter)));
        }

        if (projectTypeFilter) {
            conditions.push(eq(projects.projectTypeId, parseInt(projectTypeFilter)));
        }

        if (contactFilter) {
            conditions.push(eq(projects.contactId, parseInt(contactFilter)));
        }

        if (responsibleFilter) {
            conditions.push(eq(projects.responsibleId, responsibleFilter));
        }

        if (currentStageFilter) {
            conditions.push(eq(projects.currentStageId, parseInt(currentStageFilter)));
        }

        if (dateFrom) {
            conditions.push(gte(projects.createdAt, dateFrom));
        }

        if (dateTo) {
            conditions.push(lte(projects.createdAt, dateTo));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(projects)
            .where(whereClause);

        // Get paginated data with relations
        const offset = (page - 1) * perPage;
        const projectsList = await db.query.projects.findMany({
            where: whereClause,
            with: {
                contact: true,
                tag_statusId: true,
                tag_projectTypeId: true,
                stage: true,
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(projects.createdAt)],
            limit: perPage,
            offset: offset,
        });

        // Transform data to use frontend-friendly field names
        const transformedProjects = projectsList.map((project) => ({
            ...project,
            status: project.tag_statusId,
            projectType: project.tag_projectTypeId,
            currentStage: project.stage,
            responsible: project.user,
            // Remove the old field names
            tag_statusId: undefined,
            tag_projectTypeId: undefined,
            stage: undefined,
            user: undefined,
        }));

        return NextResponse.json({
            data: transformedProjects,
            pagination: {
                total: count,
                page,
                perPage,
                totalPages: Math.ceil(count / perPage),
            },
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const {
            name,
            description,
            direction,
            contactId,
            statusId,
            projectTypeId,
            currentStageId,
            initialStageId,
            responsibleId,
            teamId,
            tempStages,
            pendingFileIds,
        } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const now = DateService.toISO();

        // Create project
        const [project] = await db
            .insert(projects)
            .values({
                name,
                description: description || null,
                direction: direction || null,
                contactId: contactId ? parseInt(contactId) : null,
                statusId: statusId ? parseInt(statusId) : null,
                projectTypeId: projectTypeId ? parseInt(projectTypeId) : null,
                currentStageId: currentStageId ? parseInt(currentStageId) : null,
                responsibleId: responsibleId || null,
                teamId: teamId ? parseInt(teamId) : null,
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        // Handle temp stages
        const tempStageIdMap: Record<string, number> = {};
        if (tempStages && Array.isArray(tempStages)) {
            for (const tempStage of tempStages) {
                const [newStage] = await db
                    .insert(stages)
                    .values({
                        projectId: project.id,
                        name: tempStage.name,
                        description: tempStage.description || null,
                        createdAt: now,
                        updatedAt: now,
                    })
                    .returning();

                if (tempStage.id) {
                    tempStageIdMap[tempStage.id] = newStage.id;
                }
            }
        }

        // Update current stage if it was a temp stage
        if (initialStageId) {
            const realStageId = tempStageIdMap[initialStageId] || parseInt(initialStageId);
            if (realStageId) {
                await db
                    .update(projects)
                    .set({ currentStageId: realStageId, updatedAt: now })
                    .where(eq(projects.id, project.id));
            }
        }

        // Handle file attachments
        if (pendingFileIds && Array.isArray(pendingFileIds) && pendingFileIds.length > 0) {
            const fileLinksData = pendingFileIds.map((fileId) => ({
                fileId: parseInt(fileId),
                fileableType: "Project",
                fileableId: project.id,
                areaId: null,
                createdAt: now,
                updatedAt: now,
            }));

            await db.insert(filesLinks).values(fileLinksData);
        }

        // Fetch created project with relations
        const createdProject = await db.query.projects.findFirst({
            where: eq(projects.id, project.id),
            with: {
                contact: true,
                tag_statusId: true,
                tag_projectTypeId: true,
                stage: true,
                user: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                team: true,
            },
        });

        // Transform data to use frontend-friendly field names
        const transformedProject = {
            ...createdProject,
            status: createdProject?.tag_statusId,
            projectType: createdProject?.tag_projectTypeId,
            currentStage: createdProject?.stage,
            responsible: createdProject?.user,
            tag_statusId: undefined,
            tag_projectTypeId: undefined,
            stage: undefined,
            user: undefined,
        };

        return NextResponse.json(transformedProject, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json(
            { error: "Failed to create project" },
            { status: 500 }
        );
    }
}
