import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, projects } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch License Types
        const licenseTypeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_licencia"),
        });
        const licenseTypeOptions = licenseTypeCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, licenseTypeCategory.id),
        }) : [];

        // Fetch Statuses
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_licencia"),
        });
        const statusOptions = statusCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, statusCategory.id),
        }) : [];

        // Fetch Projects
        const projectOptions = await db.query.projects.findMany({
            orderBy: [desc(projects.name)],
        });

        return NextResponse.json({
            licenseTypeOptions,
            statusOptions,
            projectOptions,
        });
    } catch (error: any) {
        console.error("Error fetching license options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
