import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apuCampaigns } from "@/drizzle/schema";
import { and, desc, eq, like, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const campaignId = searchParams.get("campaign_filter");
    const unitId = searchParams.get("unit_filter");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search
    if (search) {
        conditions.push(like(apuCampaigns.description, `%${search}%`));
    }

    // Filters
    if (campaignId) conditions.push(eq(apuCampaigns.campaignId, parseInt(campaignId)));
    if (unitId) conditions.push(eq(apuCampaigns.unitId, parseInt(unitId)));

    try {
        const data = await db.query.apuCampaigns.findMany({
            where: and(...conditions),
            with: {
                campaign: true,
                unit: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(apuCampaigns.createdAt)],
        });

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(apuCampaigns)
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
        console.error("Error fetching APU campaigns:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.campaign_id || !body.description || !body.quantity || !body.unit_price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const quantity = parseInt(body.quantity);
        const unitPrice = parseInt(body.unit_price);
        const totalPrice = quantity * unitPrice;

        const result = await db.insert(apuCampaigns).values({
            campaignId: parseInt(body.campaign_id),
            description: body.description,
            quantity: quantity,
            unitId: body.unit_id ? parseInt(body.unit_id) : null,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
        }).returning({ insertedId: apuCampaigns.id });

        return NextResponse.json({ id: result[0].insertedId, message: "APU Campaign created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating APU campaign:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
