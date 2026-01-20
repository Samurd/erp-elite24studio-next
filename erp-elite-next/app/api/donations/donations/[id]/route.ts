import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { donations } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getFilesForModel } from "@/actions/files";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const donationId = parseInt(id);

        const donation = await db.query.donations.findFirst({
            where: eq(donations.id, donationId),
            with: {
                campaign: true,
            }
        });

        if (!donation) {
            return NextResponse.json({ error: "Donation not found" }, { status: 404 });
        }

        const files = await getFilesForModel("App\\Models\\Donation", donationId);

        return NextResponse.json({ ...donation, files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const donationId = parseInt(id);
        const body = await req.json();

        await db.update(donations).set({
            name: body.name,
            campaignId: body.campaign_id ? parseInt(body.campaign_id) : null,
            amount: body.amount ? parseInt(body.amount) : 0,
            paymentMethod: body.payment_method,
            date: body.date,
            certified: body.certified ? 1 : 0,
        }).where(eq(donations.id, donationId));

        return NextResponse.json({ message: "Donation updated" });
    } catch (error: any) {
        console.error("Error updating donation:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const donationId = parseInt(id);

        await db.delete(donations).where(eq(donations.id, donationId));

        return NextResponse.json({ message: "Donation deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
