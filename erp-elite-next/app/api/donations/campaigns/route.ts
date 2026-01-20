import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, donations } from "@/drizzle/schema";
import { and, desc, eq, like, gte, lte, or, sql, inArray } from "drizzle-orm";
import { attachFileToModel } from "@/actions/files";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status_filter");
    const responsible = searchParams.get("responsible_filter");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            or(
                like(campaigns.name, `%${search}%`),
                like(campaigns.address, `%${search}%`), // from controller: orWhere('address', ...)
                like(campaigns.description, `%${search}%`),
                like(campaigns.alliances, `%${search}%`)
            )
        );
    }

    if (status) {
        conditions.push(eq(campaigns.statusId, parseInt(status)));
    }

    if (responsible) {
        conditions.push(eq(campaigns.responsibleId, responsible));
    }

    if (dateFrom) {
        conditions.push(gte(campaigns.dateEvent, dateFrom));
    }

    if (dateTo) {
        conditions.push(lte(campaigns.dateEvent, dateTo));
    }

    try {
        // Fetch campaigns
        const data = await db.query.campaigns.findMany({
            where: and(...conditions),
            with: {
                status: true,
                user: true, // responsible relation is named 'user' in relations.ts
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(campaigns.createdAt)],
        });

        // Aggregates: Donations count and sum amount
        const campaignIds = data.map(c => c.id);
        const aggregatesMap = new Map();

        if (campaignIds.length > 0) {
            const aggs = await db.select({
                campaignId: donations.campaignId,
                count: sql<number>`count(*)`,
                totalAmount: sql<number>`sum(${donations.amount})`
            })
                .from(donations)
                .where(inArray(donations.campaignId, campaignIds))
                .groupBy(donations.campaignId);

            aggs.forEach(a => {
                aggregatesMap.set(a.campaignId, {
                    count: a.count,
                    totalAmount: a.totalAmount || 0
                });
            });
        }

        const dataWithAggregates = data.map(c => {
            const agg = aggregatesMap.get(c.id) || { count: 0, totalAmount: 0 };
            return {
                ...c,
                donations_count: agg.count,
                total_donations_amount: agg.totalAmount,
                // map 'user' to 'responsible' for frontend consistency if needed, 
                // but frontend code uses `campaign.responsible.name`.
                // In `with`, we got `user`. 
                // I will explicitly map it to `responsible` to match Vue prop expectations easily.
                responsible: c.user,
                user: undefined
            };
        });

        // Total count for pagination
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(campaigns)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data: dataWithAggregates,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation - basic checks
        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const result = await db.insert(campaigns).values({
            name: body.name,
            dateEvent: body.date_event || null,
            address: body.address,
            responsibleId: body.responsible_id || null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            alliances: body.alliances,
            goal: body.goal ? parseInt(body.goal) : null,
            estimatedBudget: body.estimated_budget ? parseInt(body.estimated_budget) : null,
            description: body.description,
        }).returning({ id: campaigns.id });

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Campaign", result[0].id);
            }
        }

        return NextResponse.json({ id: result[0].id, message: "Campaign created" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
