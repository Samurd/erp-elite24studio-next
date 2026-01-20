import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagCategories, tags, contacts } from "@/drizzle/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch Statuses (Category slug: estado_cotizacion)
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_cotizacion"),
        });
        const statusOptions = statusCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, statusCategory.id),
        }) : [];

        // Fetch Contacts
        const contactOptions = await db.query.contacts.findMany({
            orderBy: [asc(contacts.name)],
            columns: {
                id: true,
                name: true,
            }
        });

        return NextResponse.json({
            statusOptions,
            contactOptions,
        });
    } catch (error: any) {
        console.error("Error fetching quote options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
