import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, tagCategories, tags } from "@/drizzle/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Campaigns
        const campaignOptions = await db.query.campaigns.findMany({
            orderBy: (campaigns, { asc }) => [asc(campaigns.name)],
            columns: { id: true, name: true }
        });

        // Units (unidad or unidad_medida)
        let unitOptions: any[] = [];
        const unitCategory = await db.query.tagCategories.findFirst({
            where: or(eq(tagCategories.slug, "unidad"), eq(tagCategories.slug, "unidad_medida")),
        });

        if (unitCategory) {
            unitOptions = await db.query.tags.findMany({
                where: eq(tags.categoryId, unitCategory.id),
                columns: { id: true, name: true, color: true },
            });
        }

        return NextResponse.json({
            campaignOptions,
            unitOptions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
