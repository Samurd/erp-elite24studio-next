
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, contacts, tags, filesLinks, areas, users, files } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { DateService } from "@/lib/date-service";
import { StorageService } from "@/lib/storage-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const result = await db
            .select({
                // Invoice Fields
                id: invoices.id,
                code: invoices.code,
                invoiceDate: invoices.invoiceDate,
                total: invoices.total,
                description: invoices.description,
                methodPayment: invoices.methodPayment,
                // Contact
                contactId: contacts.id,
                contactName: contacts.name,
                contactCompany: contacts.company,
                // Status
                statusId: tags.id,
                statusName: tags.name,
                // Creator
                createdById: users.id,
                createdByName: users.name,
            })
            .from(invoices)
            .leftJoin(contacts, eq(invoices.contactId, contacts.id))
            .leftJoin(tags, eq(invoices.statusId, tags.id))
            .leftJoin(users, eq(invoices.createdById, users.id))
            .where(eq(invoices.id, id))
            .limit(1);

        const row = result[0];

        if (!row) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        // Fetch files
        let fileResults = [];
        try {
            const rawVerify = await db
                .select({
                    id: files.id,
                    name: files.name,
                    size: files.size,
                    path: files.path,
                    disk: files.disk,
                    mimeType: files.mimeType,
                })
                .from(filesLinks)
                .innerJoin(files, eq(filesLinks.fileId, files.id))
                .where(and(
                    eq(filesLinks.fileableId, id),
                    eq(filesLinks.fileableType, 'App\\Models\\Invoice')
                ));

            // Generate URLs
            fileResults = await Promise.all(rawVerify.map(async (file) => ({
                id: file.id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                url: await StorageService.getUrl(file.path) || ''
            })));
        } catch (error) {
            console.error("Error fetching files:", error);
        }

        // Map to structured object
        const invoice = {
            id: row.id,
            code: row.code,
            invoiceDate: row.invoiceDate,
            total: row.total,
            description: row.description,
            methodPayment: row.methodPayment,
            contactId: row.contactId,
            statusId: row.statusId,
            contact: row.contactId ? {
                id: row.contactId,
                name: row.contactName,
                company: row.contactCompany
            } : null,
            status: row.statusId ? {
                id: row.statusId,
                name: row.statusName
            } : null,
            createdByName: row.createdByName,
            files: fileResults
        };

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const body = await req.json();

        const schema = z.object({
            invoice_date: z.string().min(1),
            code: z.string().min(1),
            contact_id: z.number().or(z.string().transform(v => parseInt(v))),
            description: z.string().optional(),
            total_amount: z.number().min(0).or(z.string().transform(v => parseFloat(v))),
            method_payment: z.string().optional(),
            status_id: z.number().optional().or(z.string().transform(v => parseInt(v)).optional()),
            pending_file_ids: z.array(z.number()).optional(),
        });

        const validated = schema.parse(body);

        // Check existence
        const currentResult = await db.select({ id: invoices.id, code: invoices.code }).from(invoices).where(eq(invoices.id, id)).limit(1);
        if (currentResult.length === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        const current = currentResult[0];

        // Unique code check
        if (validated.code !== current.code) {
            const existing = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.code, validated.code)).limit(1);
            if (existing.length > 0 && existing[0].id !== id) {
                return NextResponse.json({ error: { code: ["Code already exists"] } }, { status: 422 });
            }
        }

        await db.update(invoices).set({
            code: validated.code,
            invoiceDate: DateService.toDB(DateService.parseToDate(validated.invoice_date)),
            contactId: validated.contact_id,
            description: validated.description,
            total: validated.total_amount,
            methodPayment: validated.method_payment,
            statusId: validated.status_id,
        }).where(eq(invoices.id, id));

        // Handle Files
        if (validated.pending_file_ids && validated.pending_file_ids.length > 0) {
            const financeAreaResult = await db.select({ id: areas.id }).from(areas).where(eq(areas.slug, 'finanzas')).limit(1);
            const financeArea = financeAreaResult[0];

            const links = validated.pending_file_ids.map(fileId => ({
                fileId: fileId,
                fileableId: id,
                fileableType: 'App\\Models\\Invoice',
                areaId: financeArea?.id
            }));

            if (links.length > 0) {
                await db.insert(filesLinks).values(links);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: paramId } = await params;
        const id = parseInt(paramId);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        await db.delete(invoices).where(eq(invoices.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
