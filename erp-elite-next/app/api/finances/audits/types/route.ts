import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const category = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, 'tipo_auditoria')
        });

        if (!category) {
            return NextResponse.json([]);
        }

        const auditTypes = await db.select({
            id: tags.id,
            name: tags.name,
            slug: tags.slug,
        })
            .from(tags)
            .where(eq(tags.categoryId, category.id));

        return NextResponse.json(auditTypes);

    } catch (error: any) {
        console.error("Error fetching audit types:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
