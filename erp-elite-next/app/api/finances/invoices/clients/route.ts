
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, tags, tagCategories, filesLinks, areas, users } from "@/drizzle/schema";
import { count, desc, eq, and, like, or, notLike, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

// Helper to generate Invoice Code
async function generateInvoiceCode() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    let isUnique = false;
    let code = "";
    let attempts = 0;

    while (!isUnique && attempts < 100) {
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        code = `INV-${dateStr}-${random}`;

        // Check uniqueness using select
        const existing = await db
            .select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.code, code))
            .limit(1);

        if (existing.length === 0) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        code = `INV-${dateStr}-${Date.now().toString().slice(-6)}`;
    }

    return code;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const statusFilter = searchParams.get("status_filter");
        const contactFilter = searchParams.get("contact_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        // 1. Get 'Cliente' tag ID for contact relation type
        // Replaced db.query with db.select
        const clienteTagResult = await db
            .select({ id: tags.id })
            .from(tags)
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(and(
                eq(tagCategories.slug, "tipo_relacion"),
                eq(tags.name, "Cliente")
            ))
            .limit(1);

        const clienteTag = clienteTagResult[0];

        // Build Query
        let query = db
            .select({
                id: invoices.id,
                code: invoices.code,
                invoiceDate: invoices.invoiceDate,
                total: invoices.total,
                statusId: invoices.statusId,
                contactName: contacts.name,
                contactId: contacts.id,
                statusName: tags.name,
                statusColor: tags.color,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .leftJoin(tags, eq(invoices.statusId, tags.id));

        const queryConditions = [
            like(invoices.code, "INV-%"),
            notLike(invoices.code, "INV-PRV-%"),
        ];

        if (clienteTag) {
            queryConditions.push(eq(contacts.relationTypeId, clienteTag.id));
        }

        if (search) {
            queryConditions.push(
                or(
                    like(invoices.code, `%${search}%`),
                    like(contacts.name, `%${search}%`),
                    like(contacts.company, `%${search}%`)
                )
            );
        }

        if (statusFilter && statusFilter !== 'all') queryConditions.push(eq(invoices.statusId, parseInt(statusFilter)));
        if (contactFilter && contactFilter !== 'all') queryConditions.push(eq(invoices.contactId, parseInt(contactFilter)));
        if (dateFrom) queryConditions.push(gte(invoices.invoiceDate, dateFrom));
        if (dateTo) queryConditions.push(lte(invoices.invoiceDate, dateTo));

        // @ts-ignore
        const finalWhere = and(...queryConditions);

        // Count total
        // Need to use same joins for filtering
        const totalResult = await db
            .select({ count: count() })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .where(finalWhere);

        const total = totalResult[0].count;
        const totalPages = Math.ceil(total / limit);

        // Fetch Data
        const rows = await db
            .select({
                id: invoices.id,
                code: invoices.code,
                invoiceDate: invoices.invoiceDate,
                total: invoices.total,
                contactId: contacts.id,
                contactName: contacts.name,
                statusId: tags.id,
                statusName: tags.name,
                statusColor: tags.color,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .leftJoin(tags, eq(invoices.statusId, tags.id))
            .where(finalWhere)
            .orderBy(desc(invoices.invoiceDate))
            .limit(limit)
            .offset(offset);

        // Map to structure expected by frontend
        const data = rows.map(row => ({
            id: row.id,
            code: row.code,
            invoiceDate: row.invoiceDate,
            total: row.total,
            contact: {
                id: row.contactId,
                name: row.contactName,
            },
            status: row.statusId ? {
                id: row.statusId,
                name: row.statusName,
                color: row.statusColor
            } : null
        }));

        return NextResponse.json({
            data,
            meta: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const schema = z.object({
            invoice_date: z.string().min(1),
            contact_id: z.number().or(z.string().transform(v => parseInt(v))),
            description: z.string().optional(),
            total_amount: z.number().min(0).or(z.string().transform(v => parseFloat(v))),
            method_payment: z.string().optional(),
            status_id: z.number().optional().or(z.string().transform(v => parseInt(v)).optional()),
            pending_file_ids: z.array(z.number()).optional(),
        });

        const validated = schema.parse(body);
        const code = await generateInvoiceCode();

        const session = await auth.api.getSession({
            headers: await headers()
        });
        const userId = session?.user?.id;

        const [newInvoice] = await db.insert(invoices).values({
            code: code,
            invoiceDate: DateService.toDB(DateService.parseToDate(validated.invoice_date)),
            contactId: validated.contact_id,
            description: validated.description,
            total: validated.total_amount,
            methodPayment: validated.method_payment,
            statusId: validated.status_id,
            createdById: userId,
        }).returning();

        if (validated.pending_file_ids && validated.pending_file_ids.length > 0) {
            // Replaced db.query with select
            const financeAreaResult = await db
                .select({ id: areas.id })
                .from(areas)
                .where(eq(areas.slug, 'finanzas'))
                .limit(1);

            const financeArea = financeAreaResult[0];

            const links = validated.pending_file_ids.map(fileId => ({
                fileId: fileId,
                fileableId: newInvoice.id,
                fileableType: 'App\\Models\\Invoice',
                areaId: financeArea?.id
            }));

            if (links.length > 0) {
                await db.insert(filesLinks).values(links);
            }
        }

        return NextResponse.json(newInvoice, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
