import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export async function GET() {
    try {
        // Fetch Types - using correct slug from laravel controller "tipo_ingreso"
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_ingreso"),
        });
        const incomeTypes = typeCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, typeCategory.id),
        }) : [];

        // Fetch Categories - "categoria_ingreso"
        const categoryCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "categoria_ingreso"),
        });
        const categories = categoryCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, categoryCategory.id),
        }) : [];

        // Fetch Results - "resultado_ingreso"
        const resultCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "resultado_ingreso"),
        });
        const results = resultCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, resultCategory.id),
        }) : [];

        // Fetch Users (Responsibles) - Filtering by area 'finanzas' might be complex without relation, 
        // for now fetching all users as per pattern in other modules, or we can look into permissions later.
        // The Laravel controller uses `PermissionCacheService::getUsersByArea('finanzas')`.
        // We will fetch all users for now.
        const allUsers = await db.query.users.findMany({
            orderBy: [desc(users.name)],
        });

        const resolvedUsers = await Promise.all(allUsers.map(async (u) => ({
            id: u.id,
            name: u.name,
            image: await StorageService.getUrl(u.image)
        })));

        return NextResponse.json({
            incomeTypes,
            categories,
            results,
            users: resolvedUsers
        });
    } catch (error: any) {
        console.error("Error fetching gross income options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
