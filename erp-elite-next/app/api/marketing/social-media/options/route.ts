import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users, projects } from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET() {
    try {
        const category = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_publicacion"),
        });

        const statusOptions = category
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, category.id),
            })
            : [];

        const responsibleOptions = await db.query.users.findMany({
            orderBy: [asc(users.name)],
        });

        const projectOptions = await db.query.projects.findMany({
            orderBy: [asc(projects.name)],
        });

        return NextResponse.json({
            statusOptions,
            responsibleOptions,
            projectOptions,
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
