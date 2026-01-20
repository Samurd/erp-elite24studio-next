
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, tags, tagCategories } from "@/drizzle/schema";
import { eq, and, asc, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Get Status Options
        const statusOptions = await db
            .select({
                id: tags.id,
                name: tags.name
            })
            .from(tags)
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(eq(tagCategories.slug, "estado_factura"));

        // Get Provider Contacts
        const relationTypeTag = await db
            .select({ id: tags.id })
            .from(tags)
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(and(
                eq(tagCategories.slug, "tipo_relacion"),
                ilike(tags.name, "proveedor")
            ))
            .limit(1)
            .then(res => res[0]);

        let providerContacts = [];

        if (relationTypeTag) {
            providerContacts = await db
                .select({
                    id: contacts.id,
                    name: contacts.name,
                    company: contacts.company,
                })
                .from(contacts)
                .where(eq(contacts.relationTypeId, relationTypeTag.id))
                .orderBy(asc(contacts.name));
        }

        return NextResponse.json({
            statusOptions,
            providerContacts
        });

    } catch (error) {
        console.error("Error fetching provider invoice options:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
