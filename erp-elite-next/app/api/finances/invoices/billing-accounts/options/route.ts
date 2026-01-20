
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

        // Get Client Contacts
        // First find "Cliente" tag (case insensitive)
        const relationTypeTag = await db
            .select({ id: tags.id })
            .from(tags)
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(and(
                eq(tagCategories.slug, "tipo_relacion"),
                ilike(tags.name, "cliente")
            ))
            .limit(1)
            .then(res => res[0]);

        let clientContacts = [];

        if (relationTypeTag) {
            clientContacts = await db
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
            clientContacts
        });

    } catch (error) {
        console.error("Error fetching billing account options:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
