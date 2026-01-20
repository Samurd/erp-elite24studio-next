import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, donations } from "@/drizzle/schema";
import { desc, sql, isNotNull, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Campaigns for Filter/Select
        const campaignsList = await db.query.campaigns.findMany({
            columns: {
                id: true,
                name: true,
            },
            orderBy: [desc(campaigns.createdAt)],
        });

        // Distinct Payment Methods
        const paymentMethodsResult = await db.selectDistinct({
            paymentMethod: donations.paymentMethod
        })
            .from(donations)
            .where(isNotNull(donations.paymentMethod))
            .orderBy(donations.paymentMethod);

        const paymentMethods = paymentMethodsResult.map(r => r.paymentMethod).filter(Boolean);

        return NextResponse.json({
            campaigns: campaignsList,
            paymentMethods
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
