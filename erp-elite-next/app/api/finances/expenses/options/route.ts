import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        // Fetch Categories (slug: categoria_gasto)
        const categoryType = await db.select().from(tagCategories).where(eq(tagCategories.slug, "categoria_gasto")).limit(1);
        const categories = categoryType.length > 0
            ? await db.select().from(tags).where(eq(tags.categoryId, categoryType[0].id))
            : [];

        // Fetch Results (slug: resultado_ingreso) - Matches Laravel implementation
        const resultType = await db.select().from(tagCategories).where(eq(tagCategories.slug, "resultado_ingreso")).limit(1);
        const results = resultType.length > 0
            ? await db.select().from(tags).where(eq(tags.categoryId, resultType[0].id))
            : [];

        // Fetch Users (Placeholder for 'finanzas' area filter)
        const allUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image
        }).from(users);

        return NextResponse.json({
            categories,
            results,
            users: allUsers
        });
    } catch (error: any) {
        console.error("Error fetching expense options:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
