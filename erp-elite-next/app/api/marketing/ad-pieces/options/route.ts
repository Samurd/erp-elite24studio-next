import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, projects, teams, strategies } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
    try {
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_pieza"),
        });

        const formatCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "formato"),
        });

        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_pieza"),
        });

        const typeOptions = typeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, typeCategory.id),
                orderBy: [asc(tags.name)]
            })
            : [];

        const formatOptions = formatCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, formatCategory.id),
                orderBy: [asc(tags.name)]
            })
            : [];

        const statusOptions = statusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
                orderBy: [asc(tags.name)]
            })
            : [];

        const projectOptions = await db.query.projects.findMany({
            orderBy: [asc(projects.name)],
        });

        const teamOptions = await db.query.teams.findMany({
            orderBy: [asc(teams.name)],
        });

        const strategyOptions = await db.query.strategies.findMany({
            orderBy: [asc(strategies.name)],
        });

        return NextResponse.json({
            typeOptions,
            formatOptions,
            statusOptions,
            projectOptions,
            teamOptions,
            strategyOptions,
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
