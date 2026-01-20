import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apuCampaigns } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const apuId = parseInt(id);

        const apu = await db.query.apuCampaigns.findFirst({
            where: eq(apuCampaigns.id, apuId),
            with: {
                campaign: true,
                unit: true,
            }
        });

        if (!apu) {
            return NextResponse.json({ error: "APU Campaign not found" }, { status: 404 });
        }

        return NextResponse.json(apu);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const apuId = parseInt(id);
        const body = await req.json();

        if (!body.campaign_id || !body.description || !body.quantity || !body.unit_price) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const quantity = parseInt(body.quantity);
        const unitPrice = parseInt(body.unit_price);
        const totalPrice = quantity * unitPrice;

        await db.update(apuCampaigns).set({
            campaignId: parseInt(body.campaign_id),
            description: body.description,
            quantity: quantity,
            unitId: body.unit_id ? parseInt(body.unit_id) : null,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
        }).where(eq(apuCampaigns.id, apuId));

        return NextResponse.json({ message: "APU Campaign updated" });
    } catch (error: any) {
        console.error("Error updating APU campaign:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const apuId = parseInt(id);

        await db.delete(apuCampaigns).where(eq(apuCampaigns.id, apuId));

        return NextResponse.json({ message: "APU Campaign deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
