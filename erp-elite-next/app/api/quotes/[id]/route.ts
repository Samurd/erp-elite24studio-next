import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const quoteId = parseInt(id);

        const quote = await db.query.quotes.findFirst({
            where: eq(quotes.id, quoteId),
            with: {
                tag: true, // Status
                contact: true,
            }
        });

        if (!quote) {
            return NextResponse.json({ error: "Quote not found" }, { status: 404 });
        }

        const { getFilesForModel } = await import("@/actions/files")
        const files = await getFilesForModel("App\\Models\\Quote", quoteId)

        const formattedData = {
            ...quote,
            status: quote.tag,
            files
        };

        return NextResponse.json(formattedData);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const quoteId = parseInt(id);
        const body = await req.json();

        // Update Quote
        await db.update(quotes).set({
            contactId: body.contact_id ? parseInt(body.contact_id) : null,
            issuedAt: body.issued_at,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            total: body.total ? parseFloat(body.total) : 0,
        }).where(eq(quotes.id, quoteId));

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Quote", quoteId);
            }
        }

        return NextResponse.json({ message: "Quote updated" });

    } catch (error: any) {
        console.error("Error updating quote:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const quoteId = parseInt(id);

        await db.delete(quotes).where(eq(quotes.id, quoteId));

        return NextResponse.json({ message: "Quote deleted" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
