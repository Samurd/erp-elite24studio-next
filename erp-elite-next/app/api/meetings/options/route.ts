import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, teams, users } from "@/drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch Statuses (Category slug: estado_reunion)
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_reunion"),
        });
        const statusOptions = statusCategory ? await db.query.tags.findMany({
            where: eq(tags.categoryId, statusCategory.id),
        }) : [];

        // Fetch Teams
        const teamOptions = await db.query.teams.findMany({
            orderBy: [asc(teams.name)],
        });

        // Fetch Users (Legacy users table for relations)
        const userOptions = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
            .from(users)
            .orderBy(asc(users.name));

        return NextResponse.json({
            statusOptions,
            teamOptions,
            userOptions,
        });
    } catch (error: any) {
        console.error("Error fetching meeting options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
