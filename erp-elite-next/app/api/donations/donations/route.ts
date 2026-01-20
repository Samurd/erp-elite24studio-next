import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations, campaigns } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql } from "drizzle-orm";
import { attachFileToModel } from "@/actions/files";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const campaignId = searchParams.get("campaign_filter");
    const paymentMethod = searchParams.get("payment_method_filter");
    const certified = searchParams.get("certified_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            like(donations.name, `%${search}%`)
        );
    }

    if (campaignId) {
        conditions.push(eq(donations.campaignId, parseInt(campaignId)));
    }

    if (paymentMethod) {
        conditions.push(like(donations.paymentMethod, `%${paymentMethod}%`));
    }

    if (certified !== null && certified !== undefined && certified !== '') {
        conditions.push(eq(donations.certified, parseInt(certified)));
    }

    if (dateFrom) {
        conditions.push(gte(donations.date, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(donations.date, dateTo));
    }

    try {
        const data = await db.query.donations.findMany({
            where: and(...conditions),
            with: {
                campaign: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(donations.createdAt)],
        });

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(donations)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching donations:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation - basic checks
        if (!body.name || !body.amount || !body.payment_method || !body.date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [insertedDonation] = await db.insert(donations).values({
            name: body.name,
            campaignId: body.campaign_id ? parseInt(body.campaign_id) : null,
            amount: body.amount ? parseInt(body.amount) : 0,
            paymentMethod: body.payment_method,
            date: body.date,
            certified: body.certified ? 1 : 0,
        }).returning();

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Donation", insertedDonation.id);
            }
        }

        return NextResponse.json({ id: insertedDonation.id, message: "Donation created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating donation:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
