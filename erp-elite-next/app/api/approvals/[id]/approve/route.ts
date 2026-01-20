import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, approvers, tags } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers"; export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const approvalId = parseInt(params.id);
        const body = await request.json(); // contains comment
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch Statuses
        const statusApproved = await db.query.tags.findFirst({ where: eq(tags.name, 'Aprobado') });
        const statusRejected = await db.query.tags.findFirst({ where: eq(tags.name, 'Rechazado') });

        if (!statusApproved || !statusRejected) throw new Error("Status tags not found");

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
            statusId: statusApproved.id,
            comment: body.comment,
            respondedAt: new Date().toISOString()
        }).where(eq(approvers.id, approverRecord.id));

        // 4. Check Logic for Main Approval Status
        const approval = await db.query.approvals.findFirst({
            where: eq(approvals.id, approvalId),
            with: { approvers: true }
        });

        if (!approval) throw new Error("Approval not found");

        // Reload approvers to get fresh status
        // (Actually db.query above fetches fresh with relations? Yes usually)

        if (approval.allApprovers) {
            // Check if any rejected
            const anyRejected = approval.approvers.some(a => a.statusId === statusRejected.id);
            if (anyRejected) {
                await db.update(approvals).set({
                    statusId: statusRejected.id,
                    rejectedAt: new Date().toISOString()
                }).where(eq(approvals.id, approvalId));
            } else {
                // Check if all approved
                const allApproved = approval.approvers.every(a => a.statusId === statusApproved.id);
                if (allApproved) {
                    await db.update(approvals).set({
                        statusId: statusApproved.id,
                        approvedAt: new Date().toISOString()
                    }).where(eq(approvals.id, approvalId));
                }
            }
        } else {
            // If not all_approvers, one approval is enough to approve the whole thing (per Laravel logic analyzed)
            await db.update(approvals).set({
                statusId: statusApproved.id,
                approvedAt: new Date().toISOString()
            }).where(eq(approvals.id, approvalId));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error approving:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
