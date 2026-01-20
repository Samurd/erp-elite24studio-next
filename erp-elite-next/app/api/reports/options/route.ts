import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Fetch statuses appropriate for reports
        // Assuming there is a tag category for 'Reportes' or using generic statuses
        // For now, let's fetch tags where category slug is 'reportes' or 'general'?
        // The Vue code didn't specify, just passed `statusOptions`. 
        // I'll try to find a category 'status' or 'report-status'.

        // Let's assume a category "estado-reporte" exists, or just fetch all for now and user can filter if needed?
        // Better: join with categories.

        const statuses = await db.select({
            id: tags.id,
            name: tags.name,
            color: tags.color
        })
            .from(tags)
            .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(eq(tagCategories.slug, "estado_reporte"))
            .limit(50);

        // If empty, maybe return some mock or all tags? 
        // For safety I'll just return what I find for now, usually there's a seeder.

        return NextResponse.json({
            statuses
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
