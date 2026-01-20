import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, approvers, filesLinks, tags } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
// import { getServerSession } from "next-auth";
import { StorageService } from "@/lib/storage-service";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const approval = await db.query.approvals.findFirst({
            where: eq(approvals.id, id),
            with: {
                user: true,
                tag_statusId: true,
                tag_priorityId: true,
                approvers: {
                    with: {
                        user: true,
                        tag: true
                    }
                },
                filesLinks: {
                    where: (filesLinks, { eq }) => eq(filesLinks.fileableType, 'App\\Models\\Approval'),
                    with: {
                        file: true
                    }
                }
            }
        });

        if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Transform to match expected frontend structure if needed (aliasing keys)
        const formattedApproval = {
            ...approval,
            creator: {
                ...approval.user,
                image: await StorageService.getUrl(approval.user?.image)
            },
            status: approval.tag_statusId,
            priority: approval.tag_priorityId,
            approvers: await Promise.all(approval.approvers.map(async (a) => ({
                ...a,
                status: a.tag,
                user: {
                    ...a.user,
                    image: await StorageService.getUrl(a.user?.image)
                }
            }))),
            files: await Promise.all(approval.filesLinks.map(async (link: any) => ({
                ...link.file,
                url: await StorageService.getUrl(link.file.path)
            })))
        };

        return NextResponse.json(formattedApproval);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await request.json();

        // 1. Get Status 'En espera'
        const statusPending = await db.query.tags.findFirst({
            where: eq(tags.name, 'En espera')
        });

        if (!statusPending) throw new Error("Status 'En espera' not found");

        // 2. Update Approval
        await db.update(approvals).set({
            name: body.name,
            description: body.description,
            buy: body.buy ? 1 : 0,
            allApprovers: body.all_approvers ? 1 : 0,
            priorityId: body.priority_id,
            statusId: statusPending.id,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            approvedAt: null,
            rejectedAt: null
        }).where(eq(approvals.id, id));

        // 3. Reset Approvers (Delete and Recreate)
        await db.delete(approvers).where(eq(approvers.approvalId, id));

        for (const approverId of body.approvers) {
            await db.insert(approvers).values({
                approvalId: id,
                userId: approverId,
                statusId: statusPending.id,
                createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating approval:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        await db.delete(approvals).where(eq(approvals.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
