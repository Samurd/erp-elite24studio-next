import { db } from "@/lib/db";
import { tagCategories, tags, users } from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1. Fetch Types (tipo_evento)
        const typeCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "tipo_evento"),
        });

        const typeOptions = typeCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, typeCategory.id),
            })
            : [];

        // 2. Fetch Statuses (estado_evento)
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_evento"),
        });

        const statusOptions = statusCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
            })
            : [];

        // 3. Fetch Units (unidad) for Items
        const unitCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "unidad"),
        });

        const unitOptions = unitCategory
            ? await db.query.tags.findMany({
                where: eq(tags.categoryId, unitCategory.id),
            })
            : [];

        // 4. Fetch Users (Responsibles)
        const responsibleOptions = await db.query.users.findMany({
            orderBy: [asc(users.name)],
        });

        return NextResponse.json({
            types: typeOptions,
            statuses: statusOptions,
            units: unitOptions,
            responsibles: responsibleOptions,
        });
    } catch (error) {
        console.error("Error fetching event options:", error);
        return NextResponse.json(
            { error: "Error fetching options" },
            { status: 500 }
        );
    }
}
