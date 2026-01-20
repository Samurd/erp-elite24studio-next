import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch Statuses
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_suscripcion"),
        });
        const statusOptions = statusCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, statusCategory.id),
        }) : [];

        // Fetch Frequencies
        const frequencyCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "frecuencia_sub"),
        });
        const frequencyOptions = frequencyCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, frequencyCategory.id),
        }) : [];

        return NextResponse.json({
            statusOptions,
            frequencyOptions
        });
    } catch (error: any) {
        console.error("Error fetching subscription options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
