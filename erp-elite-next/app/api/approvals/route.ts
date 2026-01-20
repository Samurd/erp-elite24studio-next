import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approvals, approvers, users, tags, tagCategories, files, filesLinks } from "@/drizzle/schema";
import { eq, and, desc, sql, inArray, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";
import { StorageService } from "@/lib/storage-service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "received"; // received, sent
        const subTab = searchParams.get("subTab") || "aprobaciones"; // aprobaciones (buy=0), solicitud (buy=1)
        const page = parseInt(searchParams.get("page") || "1");
        const perPage = parseInt(searchParams.get("per_page") || "10");
        const search = searchParams.get("search") || "";

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const isBuy = subTab === "solicitud" ? 1 : 0;

        let whereClause = and(
            eq(approvals.buy, isBuy),
            // Search Logic
            search ? like(approvals.name, `%${search}%`) : undefined
        );

        // Filter by Type
        if (type === "received") {
            // Logic: whereHas('approvers', userId)
            // Using subquery or check manually
            // Simplest in Drizzle: join
            // Wait, for "received", we need approvals where CURRENT USER is an approver used in "approvals" table
            // But "approvers" is a separate table.

            // Fetch IDs of approvals where user is approver
            const userApprovals = await db.query.approvers.findMany({
                where: eq(approvers.userId, userId),
                columns: { approvalId: true }
            });
            const approvalIds = userApprovals.map(a => a.approvalId);

            if (approvalIds.length === 0) {
                return NextResponse.json({ data: [], meta: { total: 0 } });
            }

            whereClause = and(whereClause, inArray(approvals.id, approvalIds));

        } else if (type === "sent") {
            whereClause = and(whereClause, eq(approvals.createdById, userId));
        }

        const data = await db.query.approvals.findMany({
            where: whereClause,
            limit: perPage,
            offset: (page - 1) * perPage,
            orderBy: desc(approvals.createdAt),
            with: {
                user: true, // Creator
                tag_statusId: true, // Status
                tag_priorityId: true, // Priority
                approvers: {
                    with: {
                        user: true,
                        tag: true // Status
                    }
                },
                filesLinks: {
                    where: (filesLinks, { eq, and }) => eq(filesLinks.fileableType, 'App\\Models\\Approval'),
                    with: {
                        file: true
                    }
                }
            },
        });

        // Count for pagination
        const total = (await db.select({ count: sql`count(*)` }).from(approvals).where(whereClause))[0].count;

        // Transform data to match frontend expectations
        const formattedData = await Promise.all(data.map(async (item) => ({
            ...item,
            creator: {
                ...item.user,
                image: await StorageService.getUrl(item.user?.image)
            },
            status: item.tag_statusId,
            priority: item.tag_priorityId,
            approvers: await Promise.all(item.approvers.map(async (a) => ({
                ...a,
                status: a.tag,
                user: {
                    ...a.user,
                    image: await StorageService.getUrl(a.user?.image)
                }
            }))),
        })));

        const finalData = await Promise.all(formattedData.map(async (approval) => ({
            ...approval,
            files: await Promise.all(approval.filesLinks.map(async (link: any) => ({
                ...link.file,
                url: await StorageService.getUrl(link.file.path)
            })))
        })))

        return NextResponse.json({
            data: finalData,
            meta: {
                total: Number(total),
                per_page: perPage,
                current_page: page,
                last_page: Math.ceil(Number(total) / perPage)
            }
        });

    } catch (error) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Validation - Basic
        if (!body.name || !body.priority_id || !body.approvers || body.approvers.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Status 'En espera'
        const statusPending = await db.query.tags.findFirst({
            where: and(
                eq(tags.name, 'En espera'),
                // Link to Category 'estado_aprobacion' ideally
            )
        });

        if (!statusPending) throw new Error("Status 'En espera' not found");

        // 2. Create Approval
        const [result] = await db.insert(approvals).values({
            name: body.name,
            description: body.description,
            buy: body.buy ? 1 : 0,
            allApprovers: body.all_approvers ? 1 : 0,
            priorityId: body.priority_id,
            statusId: statusPending.id,
            createdById: userId,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO()
        }).returning({ insertId: approvals.id });

        const approvalId = result.insertId;

        // 3. Create Approvers
        for (const approverId of body.approvers) {
            await db.insert(approvers).values({
                approvalId: approvalId,
                userId: approverId,
                statusId: statusPending.id,
                createdAt: DateService.toISO(),
                updatedAt: DateService.toISO()
            });
        }

        // 4. Handle Files (Logic Placeholder - usually handled by linking existing uploads)
        if (body.pending_file_ids && body.pending_file_ids.length > 0) {
            // Link files logic here
            // Example: insert into filesLinks
            /*
            for (const fileId of body.pending_file_ids) {
               await db.insert(filesLinks).values({
                   fileId: fileId,
                   modelId: approvalId,
                   modelType: 'App\\Models\\Approval' // Matching Laravel Morph Map
               })
            }
            */
        }

        return NextResponse.json({ success: true, id: approvalId });

    } catch (error) {
        console.error("Error creating approval:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
