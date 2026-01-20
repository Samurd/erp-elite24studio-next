import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subs, tags } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NotificationService } from "@/lib/services/notification-service";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const subId = parseInt(id);

        const sub = await db.query.subs.findFirst({
            where: eq(subs.id, subId),
            // with: { ...relations } 
        });

        if (!sub) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        const { getFilesForModel } = await import("@/actions/files")
        const files = await getFilesForModel("App\\Models\\Sub", subId)

        return NextResponse.json({ ...sub, files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({ headers: req.headers });
        const userId = session?.user?.id;

        const { id } = await params;
        const subId = parseInt(id);
        const body = await req.json();

        await db.update(subs).set({
            name: body.name,
            frequencyId: body.frequency_id ? parseInt(body.frequency_id) : null,
            type: body.type,
            amount: parseInt(body.amount),
            statusId: body.status_id ? parseInt(body.status_id) : null,
            startDate: body.start_date,
            renewalDate: body.renewal_date,
            notes: body.notes,
        }).where(eq(subs.id, subId));

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            const { attachFileToModel } = await import("@/actions/files")
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Sub", subId);
            }
        }

        // Update Notification Template if exists
        const frequencyId = body.frequency_id ? parseInt(body.frequency_id) : null;
        if (frequencyId && body.renewal_date) {
            const freqTag = await db.query.tags.findFirst({
                where: eq(tags.id, frequencyId)
            });

            if (freqTag) {
                let pattern: any = null;
                const slug = freqTag.slug?.toLowerCase() || freqTag.name.toLowerCase();

                if (slug.includes('diario') || slug.includes('daily')) {
                    pattern = { interval: 'daily' };
                } else if (slug.includes('semanal') || slug.includes('weekly')) {
                    pattern = { interval: 'weekly' };
                } else if (slug.includes('mensual') || slug.includes('monthly')) {
                    const renewalDate = new Date(body.renewal_date);
                    pattern = { interval: 'monthly', day: renewalDate.getDate() };
                } else if (slug.includes('anual') || slug.includes('yearly')) {
                    const renewalDate = new Date(body.renewal_date);
                    pattern = { interval: 'yearly', day: renewalDate.getDate(), month: renewalDate.getMonth() + 1 };
                }

                if (pattern && userId) {
                    await NotificationService.updateTemplateByNotifiable('subscription', subId, {
                        title: `Renovación: ${body.name}`,
                        message: `La suscripción ${body.name} requiere renovación.`,
                        scheduledAt: body.renewal_date,
                        recurringPattern: pattern,
                        isActive: true,
                        userId: userId, // Pass userId for creation if receiving 404
                        type: 'recurring', // Pass type for creation
                    });
                }
            }
        }

        return NextResponse.json({ message: "Subscription updated" });
    } catch (error: any) {
        console.error("Error updating subscription:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const subId = parseInt(id);

        await db.delete(subs).where(eq(subs.id, subId));

        return NextResponse.json({ message: "Subscription deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
