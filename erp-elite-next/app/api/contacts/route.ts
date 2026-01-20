import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts, tags, tagCategories, users } from "@/drizzle";
import { eq, like, or, and, sql, desc } from "drizzle-orm";
import { getUserWithPermissions } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userData = await getUserWithPermissions(session.user.id);
        // Assuming 'contactos.view' permission. Adjust if different.
        // if (!userData.permissions.includes('contactos.view')) {
        //     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        // }

        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const empresa = searchParams.get('empresa') || '';
        const etiqueta = searchParams.get('etiqueta') || '';
        const responsable = searchParams.get('responsable') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = 10;
        const offset = (page - 1) * perPage;

        // Build query to verify column names
        // JOINs should use the table schemas

        const conditions = [];

        if (search) {
            conditions.push(or(
                like(contacts.name, `%${search}%`),
                like(contacts.emailPersonal, `%${search}%`)
            ));
        }

        if (empresa) {
            conditions.push(like(contacts.company, `%${empresa}%`));
        }

        if (responsable && responsable !== 'all') {
            conditions.push(eq(contacts.responsibleId, responsable));
        }

        if (etiqueta && etiqueta !== 'all') {
            const labelId = parseInt(etiqueta);
            if (!isNaN(labelId)) {
                conditions.push(eq(contacts.labelId, labelId));
            }
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Use db.query to handle relations cleanly
        // The previous explicit select was redundant and unused

        // However, the previous implementation returning `data` was shadowed by `contactsQuery` using `db.query`.
        // Let's us `db.query` which is nicer, providing we have relations.

        const contactsQuery = await db.query.contacts.findMany({
            where: whereClause,
            limit: perPage,
            offset: offset,
            orderBy: desc(contacts.createdAt),
            with: {
                tag_statusId: true,
                user: true,
                tag_labelId: true,
                tag_contactTypeId: true,
                tag_relationTypeId: true,
                tag_sourceId: true,
            }
        });

        const mappedContacts = contactsQuery.map((c: any) => ({
            ...c,
            email: c.emailPersonal, // Map for frontend
            status: c.tag_statusId,
            responsible: c.user,
            label: c.tag_labelId,
            contactType: c.tag_contactTypeId,
            relationType: c.tag_relationTypeId,
            source: c.tag_sourceId,
        }));

        // Count
        const allContacts = await db.select({ id: contacts.id }).from(contacts).where(whereClause);
        const count = allContacts.length;

        // Get options for filters and forms
        const [usersData, labelTags, contactTypes, relationTypes, states, sources] = await Promise.all([
            db.select({ id: users.id, name: users.name }).from(users),
            // Helper to fetch tags by slug
            (async () => {
                const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, 'etiqueta_contacto'));
                return cat.length ? await db.select().from(tags).where(eq(tags.categoryId, cat[0].id)) : [];
            })(),
            (async () => {
                const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, 'tipo_contacto'));
                return cat.length ? await db.select().from(tags).where(eq(tags.categoryId, cat[0].id)) : [];
            })(),
            (async () => {
                const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, 'tipo_relacion'));
                return cat.length ? await db.select().from(tags).where(eq(tags.categoryId, cat[0].id)) : [];
            })(),
            (async () => {
                const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, 'estado_contacto'));
                return cat.length ? await db.select().from(tags).where(eq(tags.categoryId, cat[0].id)) : [];
            })(),
            (async () => {
                const cat = await db.select().from(tagCategories).where(eq(tagCategories.slug, 'fuente'));
                return cat.length ? await db.select().from(tags).where(eq(tags.categoryId, cat[0].id)) : [];
            })(),
        ]);

        return NextResponse.json({
            data: mappedContacts,
            meta: {
                current_page: page,
                per_page: perPage,
                total: count,
                last_page: Math.ceil(count / perPage),
            },
            options: {
                users: usersData,
                labels: labelTags,
                contactTypes,
                relationTypes,
                states,
                sources
            },
            permissions: {
                view: true,
                create: true,
                update: true,
                delete: true
            }
        });

    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({
                errors: {
                    name: !body.name ? "Requerido" : undefined,
                }
            }, { status: 422 });
        }

        // Sanitize date
        if (body.firstContactDate) {
            body.firstContactDate = DateService.toDB(new Date(body.firstContactDate));
        }

        // Remove ID if present to avoid issues, though auto-inc handles it.
        const { id, email, ...dataToInsert } = body;

        await db.insert(contacts).values({
            ...dataToInsert,
            emailPersonal: email,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error creating contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
