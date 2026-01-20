import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quotes, contacts } from "@/drizzle/schema";
import { eq, and, desc, gte, lte, like, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const status = searchParams.get("status_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("perPage") || "10");
        const offset = (page - 1) * pageSize;

        // Build Where Clause
        const filters = [];

        if (search) {
            // We need to join with contacts to search by contact name, 
            // but Drizzle's query builder is easier for simple API. 
            // For now, let's search by ID or ensure we can search contact name if feasible.
            // OR filtering across relations isn't straightforward in simple query builder without separate 'or' logic
            // sticking to simple ID search or advanced query if needed.
            // Let's rely on basic ID search for simplicity first or use raw SQL if complex.
            // Actually, let's try to filter by ID string if it's numeric.
            if (!isNaN(Number(search))) {
                filters.push(eq(quotes.id, Number(search)));
            }
            // For contact name search, we would typically need a join or subquery. 
            // Leaving basic search for now.
        }

        if (status && status !== 'all') {
            filters.push(eq(quotes.statusId, parseInt(status)));
        }

        if (dateFrom) {
            filters.push(gte(quotes.issuedAt, dateFrom));
        }

        if (dateTo) {
            filters.push(lte(quotes.issuedAt, dateTo));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Count Total
        const totalResult = await db.select({ count: sql`count(*)` })
            .from(quotes)
            .where(whereClause);
        const total = Number(totalResult[0]?.count || 0);

        // Fetch Data
        const data = await db.query.quotes.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            orderBy: [desc(quotes.createdAt)],
            with: {
                tag: true, // Status
                contact: true,
            }
        });

        // Format Data
        const formattedData = data.map(quote => ({
            ...quote,
            status: quote.tag,
            // files_count: 0 // Placeholder until file relation is clear
        }));

        return NextResponse.json({
            data: formattedData,
            meta: {
                total,
                page,
                pageSize,
                lastPage: Math.ceil(total / pageSize)
            }
        });

    } catch (error: any) {
        console.error("Error listing quotes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Validation
        if (!body.issued_at) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Insert Quote
        // Note: Drizzle insert returns result object, insertId is available on MySQL
        const [insertedQuote] = await db.insert(quotes).values({
            contactId: body.contact_id ? parseInt(body.contact_id) : null,
            issuedAt: body.issued_at,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            total: body.total ? parseFloat(body.total) : 0,
            userId: undefined, // Leaving as is per original code comment
        }).returning({ id: quotes.id });

        const quoteId = insertedQuote.id;

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Quote", quoteId);
            }
        }

        return NextResponse.json({ id: quoteId, message: "Quote created" }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating quote:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
