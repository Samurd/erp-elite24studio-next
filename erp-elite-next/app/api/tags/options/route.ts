import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tags, tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const category = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, slug)
        });

        if (!category) {
            return NextResponse.json([]);
        }

        const options = await db.select().from(tags).where(eq(tags.categoryId, category.id));

        return NextResponse.json(options);

    } catch (error) {
        console.error("Error fetching tag options:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
