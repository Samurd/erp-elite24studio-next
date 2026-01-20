import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export async function GET() {
    try {
        // Fetch Types - using correct slug from laravel controller
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_certificado"),
        });
        const typeOptions = typeCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, typeCategory.id),
        }) : [];

        // Fetch Statuses - using correct slug from laravel controller
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_certificado"),
        });
        const statusOptions = statusCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, statusCategory.id),
        }) : [];

        // Fetch Users (Responsibles)
        const userOptions = await db.query.users.findMany({
            orderBy: [desc(users.name)],
        });

        const resolvedUserOptions = await Promise.all(userOptions.map(async (u) => ({
            id: u.id,
            name: u.name,
            image: await StorageService.getUrl(u.image)
        })));

        return NextResponse.json({
            typeOptions,
            statusOptions,
            userOptions: resolvedUserOptions
        });
    } catch (error: any) {
        console.error("Error fetching certificate options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
