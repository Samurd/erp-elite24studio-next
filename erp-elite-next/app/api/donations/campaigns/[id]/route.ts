import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getFilesForModel } from "@/actions/files";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

        const campaign = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, campaignId),
            with: {
                status: true,
                user: true,
            }
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const files = await getFilesForModel("App\\Models\\Campaign", campaignId);

        // Map user to responsible for consistency
        const responseData = {
            ...campaign,
            responsible: campaign.user,
            user: undefined,
            files: files
        };

        return NextResponse.json(responseData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);
        const body = await req.json();

        await db.update(campaigns).set({
            name: body.name,
            dateEvent: body.date_event || null,
            address: body.address,
            responsibleId: body.responsible_id ? parseInt(body.responsible_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            alliances: body.alliances,
            goal: body.goal ? parseInt(body.goal) : null,
            estimatedBudget: body.estimated_budget ? parseInt(body.estimated_budget) : null,
            description: body.description,
        }).where(eq(campaigns.id, campaignId));

        return NextResponse.json({ message: "Campaign updated" });
    } catch (error: any) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const campaignId = parseInt(id);

        await db.delete(campaigns).where(eq(campaigns.id, campaignId));

        return NextResponse.json({ message: "Campaign deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
