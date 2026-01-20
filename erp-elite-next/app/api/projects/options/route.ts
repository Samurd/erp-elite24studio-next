import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tags, tagCategories, contacts, users, teams, stages } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await request.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Get status options
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_proyecto"),
        });
        const statusOptions = statusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
                orderBy: (tags, { asc }) => [asc(tags.name)],
            })
            : [];

        // Get project type options
        const projectTypeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_proyecto"),
        });
        const projectTypeOptions = projectTypeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, projectTypeCategory.id),
                orderBy: (tags, { asc }) => [asc(tags.name)],
            })
            : [];

        // Get contacts
        const contactsList = await db.query.contacts.findMany({
            orderBy: (contacts, { asc }) => [asc(contacts.name)],
            columns: {
                id: true,
                name: true,
                company: true,
            },
        });

        // Get users
        const usersList = await db.query.users.findMany({
            orderBy: (users, { asc }) => [asc(users.name)],
            columns: {
                id: true,
                name: true,
                email: true,
            },
        });

        // Get teams
        const teamsList = await db.query.teams.findMany({
            orderBy: (teams, { asc }) => [asc(teams.name)],
            columns: {
                id: true,
                name: true,
                description: true,
            },
        });

        // Get all stages (global)
        const stagesList = await db.query.stages.findMany({
            orderBy: (stages, { asc }) => [asc(stages.name)],
        });

        return NextResponse.json({
            statusOptions,
            projectTypeOptions,
            contacts: contactsList,
            users: usersList,
            teams: teamsList,
            stages: stagesList,
        });
    } catch (error) {
        console.error("Error fetching project options:", error);
        return NextResponse.json(
            { error: "Failed to fetch options" },
            { status: 500 }
        );
    }
}
