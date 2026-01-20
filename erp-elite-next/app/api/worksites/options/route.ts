
import { db } from "@/lib/db";
import { projects, tags, tagCategories, users } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Projects
        const projectsData = await db.query.projects.findMany({
            orderBy: (projects, { asc }) => [asc(projects.name)],
            columns: {
                id: true,
                name: true,
            },
        });

        // Users (Responsibles)
        const usersData = await db.query.users.findMany({
            orderBy: (users, { asc }) => [asc(users.name)],
            columns: {
                id: true,
                name: true,
                profilePhotoUrl: true,
            },
        });

        // Worksite Types
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_obra"),
        });
        const typeOptions = typeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, typeCategory.id),
            })
            : [];

        // Worksite Statuses
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_obra"),
        });
        const statusOptions = statusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
            })
            : [];

        // Change Types
        const changeTypeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_cambio"),
        });
        const changeTypeOptions = changeTypeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, changeTypeCategory.id),
            })
            : [];

        // Change Statuses
        const changeStatusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_cambio"),
        });
        const changeStatusOptions = changeStatusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, changeStatusCategory.id),
            })
            : [];

        // Budget Impacts
        const budgetImpactCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "impacto_presupuesto"),
        });
        const budgetImpactOptions = budgetImpactCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, budgetImpactCategory.id),
            })
            : [];

        // Punch Item Statuses
        const punchItemStatusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_punch_item"),
        });
        const punchItemStatusOptions = punchItemStatusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, punchItemStatusCategory.id),
            })
            : [];

        // Visit Statuses
        const visitStatusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_visita"),
        });
        const visitStatusOptions = visitStatusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, visitStatusCategory.id),
            })
            : [];

        return NextResponse.json({
            projects: projectsData,
            users: usersData,
            types: typeOptions,
            statuses: statusOptions,
            changeTypes: changeTypeOptions,
            changeStatuses: changeStatusOptions,
            punchItemStatuses: punchItemStatusOptions,
            visitStatusOptions: visitStatusOptions,
            budgetImpacts: budgetImpactOptions,
        });
    } catch (error) {
        console.error("Error fetching worksite options:", error);
        return NextResponse.json(
            { error: "Error fetching options" },
            { status: 500 }
        );
    }
}
