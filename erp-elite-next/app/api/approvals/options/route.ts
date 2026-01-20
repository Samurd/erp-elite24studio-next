import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tags, tagCategories, roleHasPermissions, permissions, modelHasRoles, roles } from "@/drizzle/schema";
import { eq, and, like } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";
import { getTagCategoryBySlug } from "@/lib/utils/db-helpers"; // Assuming this exists or I use raw query

export async function GET() {
    try {
        // 1. Fetch Priorities (TagCategory: type_priority usually, but user code said 'tipo_prioridad')
        const priorityCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_prioridad"),
            with: {
                tags: true
            }
        });

        const priorities = priorityCategory?.tags || [];

        // 2. Fetch Users
        const allUsersRaw = await db.query.users.findMany({
            columns: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        });

        // Generate URLs
        const users = await Promise.all(allUsersRaw.map(async (user) => ({
            ...user,
            image: await StorageService.getUrl(user.image)
        })));

        return NextResponse.json({
            priorities,
            users
        });

    } catch (error) {
        console.error("Error fetching approval options:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
