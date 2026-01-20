import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users, projects } from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
    try {
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_caso_mk"),
        });

        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_caso_mk"),
        });

        const typeOptions = typeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, typeCategory.id),
                orderBy: [asc(tags.name)]
            })
            : [];

        const statusOptions = statusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
                orderBy: [asc(tags.name)]
            })
            : [];

        const responsibleOptions = await db.query.users.findMany({
            orderBy: [asc(users.name)],
        });

        const projectOptions = await db.query.projects.findMany({
            orderBy: [asc(projects.name)],
        });

        return NextResponse.json({
            typeOptions,
            statusOptions,
            responsibleOptions,
            projectOptions,
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
