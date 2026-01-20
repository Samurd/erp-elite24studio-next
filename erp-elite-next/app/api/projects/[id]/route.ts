import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, stages, filesLinks } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);

        const project = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
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
                team: {
                    with: {
                        teamUsers: {
                            with: {
                                user: {
                                    columns: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get project stages
        const projectStages = await db.query.stages.findMany({
            where: eq(stages.projectId, projectId),
            orderBy: (stages, { asc }) => [asc(stages.name)],
        });

        // Get project files
        const projectFiles = await db.query.filesLinks.findMany({
            where: and(
                eq(filesLinks.fileableType, "Project"),
                eq(filesLinks.fileableId, projectId)
            ),
            with: {
                file: true,
            },
        });

        // Get project plans
        const projectPlans = await db.query.plans.findMany({
            where: (plans, { eq }) => eq(plans.projectId, projectId),
            // Note: team relation is commented out in schema, so we can't include it
        });

        // Transform data to use frontend-friendly field names
        const transformedProject = {
            ...project,
            status: project.tag_statusId,
            projectType: project.tag_projectTypeId,
            currentStage: project.stage,
            responsible: project.user,
            tag_statusId: undefined,
            tag_projectTypeId: undefined,
            stage: undefined,
            user: undefined,
            stages: projectStages,
            files: projectFiles.map((fl) => fl.file),
            plans: projectPlans,
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json(
            { error: "Failed to fetch project" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);
        const body = await request.json();

        const {
            name,
            description,
            direction,
            contactId,
            statusId,
            projectTypeId,
            currentStageId,
            responsibleId,
            teamId,
            managedStages,
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

        // Update project
        await db
            .update(projects)
            .set({
                name,
                description: description || null,
                direction: direction || null,
                contactId: contactId ? parseInt(contactId) : null,
                statusId: statusId ? parseInt(statusId) : null,
                projectTypeId: projectTypeId ? parseInt(projectTypeId) : null,
                currentStageId: currentStageId ? parseInt(currentStageId) : null,
                responsibleId: responsibleId || null,
                teamId: teamId ? parseInt(teamId) : null,
                updatedAt: now,
            })
            .where(eq(projects.id, projectId));

        // Update plans team_id if team changed
        if (teamId) {
            await db
                .update(db._.fullSchema.plans)
                .set({ teamId: parseInt(teamId), updatedAt: now })
                .where(eq(db._.fullSchema.plans.projectId, projectId));
        }

        // Sync stages
        if (managedStages && Array.isArray(managedStages)) {
            for (const stageData of managedStages) {
                if (typeof stageData.id === "string" && stageData.id.startsWith("temp_")) {
                    // Create new stage
                    await db.insert(stages).values({
                        projectId: projectId,
                        name: stageData.name,
                        description: stageData.description || null,
                        createdAt: now,
                        updatedAt: now,
                    });
                } else if (typeof stageData.id === "number") {
                    // Update existing stage
                    await db
                        .update(stages)
                        .set({
                            name: stageData.name,
                            description: stageData.description || null,
                            updatedAt: now,
                        })
                        .where(eq(stages.id, stageData.id));
                }
            }
        }

        // Handle file attachments
        if (pendingFileIds && Array.isArray(pendingFileIds) && pendingFileIds.length > 0) {
            const fileLinksData = pendingFileIds.map((fileId) => ({
                fileId: parseInt(fileId),
                fileableType: "Project",
                fileableId: projectId,
                areaId: null,
                createdAt: now,
                updatedAt: now,
            }));

            await db.insert(filesLinks).values(fileLinksData);
        }

        // Fetch updated project
        const updatedProject = await db.query.projects.findFirst({
            where: eq(projects.id, projectId),
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
            ...updatedProject,
            status: updatedProject?.tag_statusId,
            projectType: updatedProject?.tag_projectTypeId,
            currentStage: updatedProject?.stage,
            responsible: updatedProject?.user,
            tag_statusId: undefined,
            tag_projectTypeId: undefined,
            stage: undefined,
            user: undefined,
        };

        return NextResponse.json(transformedProject);
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json(
            { error: "Failed to update project" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const projectId = parseInt(id);

        await db.delete(projects).where(eq(projects.id, projectId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 }
        );
    }
}
