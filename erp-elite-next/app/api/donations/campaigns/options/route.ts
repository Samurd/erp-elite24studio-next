import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, users, tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export async function GET(req: NextRequest) {
    try {
        // Status Options (Category: estado_campana)
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_campana")
        });

        let statusOptions: any[] = [];
        if (statusCategory) {
            statusOptions = await db.select()
                .from(tags)
                .where(eq(tags.categoryId, statusCategory.id));
        }

        // Responsible Options (Users)
        const rawUsers = await db.select({
            id: users.id,
            name: users.name,
            image: users.image
        })
            .from(users)
            .orderBy(users.name);

        const userOptions = await Promise.all(rawUsers.map(async (u) => ({
            ...u,
            image: await StorageService.getUrl(u.image)
        })));

        return NextResponse.json({
            statusOptions,
            userOptions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
