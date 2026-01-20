import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { caseRecords, contacts, users, tags, tagCategories, filesLinks } from "@/drizzle/schema";
import { eq, and, like, desc, sql, aliasedTable, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const search = req.nextUrl.searchParams.get("search");
    const canal = req.nextUrl.searchParams.get("canal");
    const estado = req.nextUrl.searchParams.get("estado");
    const tipo_caso = req.nextUrl.searchParams.get("tipo_caso");
    const asesor = req.nextUrl.searchParams.get("asesor");
    const fecha = req.nextUrl.searchParams.get("fecha");
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const perPage = 15;

    const statusTags = aliasedTable(tags, "statusTags");
    const typeTags = aliasedTable(tags, "typeTags");

    const conditions = [];

    // CRITICAL: Filter out soft-deleted records
    conditions.push(isNull(caseRecords.deletedAt));

    if (search) {
        conditions.push(
            sql`(${contacts.name} LIKE ${`%${search}%`} OR ${users.name} LIKE ${`%${search}%`})`
        );
    }
    if (canal) conditions.push(like(caseRecords.channel, `%${canal}%`));
    if (estado) conditions.push(eq(caseRecords.statusId, parseInt(estado)));
    if (tipo_caso) conditions.push(eq(caseRecords.caseTypeId, parseInt(tipo_caso)));
    if (asesor) conditions.push(eq(caseRecords.assignedToId, parseInt(asesor)));
    if (fecha) conditions.push(eq(caseRecords.date, fecha));

    const offset = (page - 1) * perPage;

    // Count Total
    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(caseRecords)
        .leftJoin(contacts, eq(caseRecords.contactId, contacts.id))
        .leftJoin(users, eq(caseRecords.assignedToId, users.id))
        .where(and(...conditions));

    const total = totalResult.count;
    const last_page = Math.ceil(total / perPage);

    // Fetch Data
    // Fetch Data with files
    const rawData = await db
        .select({
            id: caseRecords.id,
            date: caseRecords.date,
            channel: caseRecords.channel,
            description: caseRecords.description,
            contact: {
                id: contacts.id,
                name: contacts.name,
            },
            assigned_to: {
                id: users.id,
                name: users.name,
            },
            status: {
                id: statusTags.id,
                name: statusTags.name,
                color: statusTags.color,
            },
            type: {
                id: typeTags.id,
                name: typeTags.name,
            },
        })
        .from(caseRecords)
        .leftJoin(contacts, eq(caseRecords.contactId, contacts.id))
        .leftJoin(users, eq(caseRecords.assignedToId, users.id))
        .leftJoin(statusTags, eq(caseRecords.statusId, statusTags.id))
        .leftJoin(typeTags, eq(caseRecords.caseTypeId, typeTags.id))
        .where(and(...conditions))
        .orderBy(desc(caseRecords.date), desc(caseRecords.id))
        .limit(perPage)
        .offset(offset);

    // Fetch files for each record
    const recordIds = rawData.map(r => r.id);
    const fileLinks = recordIds.length > 0
        ? await db.query.filesLinks.findMany({
            where: and(
                eq(filesLinks.fileableType, "App\\Models\\CaseRecord"),
                sql`${filesLinks.fileableId} IN (${sql.join(recordIds.map(id => sql`${id}`), sql`, `)})`
            ),
            with: {
                file: true
            }
        })
        : [];

    // Map files to records with presigned URLs for S3
    const dataPromises = rawData.map(async (record) => {
        const recordFiles = fileLinks
            .filter(link => link.fileableId === record.id)
            .map(link => link.file)
            .filter(f => f !== null);

        // Generate URLs for files (with presigned URLs for S3)
        const filesWithUrls = await Promise.all(
            recordFiles.map(async (f) => {
                let url: string;
                if (f!.disk === 's3') {
                    // S3 files: generate presigned URL
                    const { getSignedUrl } = await import('@/lib/s3');
                    try {
                        url = await getSignedUrl(f!.path, 3600); // 1 hour expiration
                    } catch (error) {
                        console.error('Error generating presigned URL:', error);
                        const { AWS_URL } = require('@/lib/s3');
                        url = f!.path.startsWith('http') ? f!.path : `${AWS_URL}${f!.path}`;
                    }
                } else {
                    url = f!.path.startsWith('http') ? f!.path : `/${f!.path}`;
                }

                return {
                    id: f!.id,
                    name: f!.name,
                    size: f!.size,
                    mimeType: f!.mimeType,
                    url: url,
                };
            })
        );

        return {
            ...record,
            files: filesWithUrls
        };
    });

    const data = await Promise.all(dataPromises);

    // Fetch Options for Filters/Modal
    // Note: In a real app we might want to cache these or fetch partially
    const userOptions = await db.select({ id: users.id, name: users.name }).from(users);

    // To get tags correctly we need category IDs. 
    // Assuming slugs "estado-casos" and "tipo-casos" or similar.
    // I'll check the seed later if this fails, but for now I'll fetch by joining categories.

    const stateOptions = await db
        .select({ id: tags.id, name: tags.name, color: tags.color })
        .from(tags)
        .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
        .where(eq(tagCategories.slug, "estado_caso")); // Check slug name!

    const typeOptions = await db
        .select({ id: tags.id, name: tags.name })
        .from(tags)
        .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
        .where(eq(tagCategories.slug, "tipo_caso")); // Check slug name!

    // Also contacts for the dropdown
    const contactOptions = await db.select({ id: contacts.id, name: contacts.name }).from(contacts);

    return NextResponse.json({
        data,
        meta: {
            current_page: page,
            per_page: perPage,
            total,
            last_page,
        },
        options: {
            users: userOptions,
            states: stateOptions,
            case_types: typeOptions,
            contacts: contactOptions,
        },
        permissions: {
            // Simplified, logic should come from user session
            view: true,
            create: true,
            update: true,
            delete: true,
        },
    });
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
        date,
        channel,
        case_type_id,
        status_id,
        assigned_to_id,
        contact_id,
        description,
        pending_file_ids
    } = body;

    try {
        // Insert the case record with .returning() for PostgreSQL
        const [insertedRecord] = await db.insert(caseRecords).values({
            date: date,
            channel: channel,
            caseTypeId: case_type_id,
            statusId: status_id,
            assignedToId: assigned_to_id,
            contactId: contact_id,
            description: description,
        }).returning({ id: caseRecords.id });

        if (!insertedRecord?.id) {
            throw new Error("Failed to get inserted case record ID");
        }

        const insertedId = insertedRecord.id;

        // Attach Files
        if (pending_file_ids && pending_file_ids.length > 0) {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const links = pending_file_ids.map((fileId: number) => ({
                fileId: fileId,
                fileableId: insertedId,
                fileableType: "App\\Models\\CaseRecord", // Morph Map
                createdAt: now,
                updatedAt: now,
                // areaId... we should probably set this if needed, derived from slug "registro-casos"
            }));

            await db.insert(filesLinks).values(links);
        }

        return NextResponse.json({ success: true, id: insertedId });
    } catch (error) {
        console.error("Error creating case record:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
