import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, approvers, tags } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const approvalId = parseInt(params.id);
        const body = await request.json(); // comment
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch Statuses
        const statusRejected = await db.query.tags.findFirst({ where: eq(tags.name, 'Rechazado') });
        if (!statusRejected) throw new Error("Status tags not found");

        // 2. Find Approver Record
        const approverRecord = await db.query.approvers.findFirst({
            where: and(
                eq(approvers.approvalId, approvalId),
                eq(approvers.userId, userId)
            )
        });

        if (!approverRecord) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        // 3. Update Approver Status
        await db.update(approvers).set({
            statusId: statusRejected.id,
            comment: body.comment,
            respondedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).where(eq(approvers.id, approverRecord.id));

        // 4. Update Main Approval Status (Immediate Rejection)
        await db.update(approvals).set({
            statusId: statusRejected.id,
            rejectedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).where(eq(approvals.id, approvalId));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error rejecting:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
