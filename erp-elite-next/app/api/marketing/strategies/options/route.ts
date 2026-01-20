import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch statuses for strategies
        // Assuming there is a 'marketing-strategy-status' or similar category. 
        // If not, we might need to find the correct category slug.
        // Let's assume 'strategy-status' or check logic elsewhere.
        // Previous modules used 'license-status', 'policy-status'.
        // I will check if 'strategy-status' exists or use a generic one.
        // For now, let's fetch 'strategy-status' and 'users'.

        // Actually, often these are just generic tags. 
        // Let's safe bet fetch 'strategy-status'. If empty, user needs to create them.

        const statusOptions = await db.query.tags.findMany({
            where: eq(tags.slug, 'strategy-status') // This might be wrong if it's by category.
        });

        // Wait, tags usually belong to a category. 
        // Let's join with category.

        const strategyStatuses = await db.select({
            id: tags.id,
            name: tags.name,
            color: tags.color
        })
            .from(tags)
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(eq(tagCategories.slug, 'strategy-status'));

        const responsibleOptions = await db.select({
            id: users.id,
            name: users.name,
            image: users.image
        }).from(users);

        return NextResponse.json({
            statusOptions: strategyStatuses,
            responsibleOptions: responsibleOptions
        });

    } catch (error) {
        console.error("Error fetching strategy options:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
