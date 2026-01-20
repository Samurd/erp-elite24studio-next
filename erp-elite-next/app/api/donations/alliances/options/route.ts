import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagCategories, tags } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Alliance Types (tipo_alianza)
        let typeOptions: any[] = [];
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_alianza"),
        });

        if (typeCategory) {
            typeOptions = await db.query.tags.findMany({
                where: eq(tags.categoryId, typeCategory.id),
                columns: { id: true, name: true, color: true },
            });
        }

        return NextResponse.json({
            typeOptions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
