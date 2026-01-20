import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contracts, files, filesLinks } from "@/drizzle/schema";
import { eq, and, sql, or } from "drizzle-orm";
import { DateService } from "@/lib/date-service";
import { StorageService } from "@/lib/storage-service";

import { getFilesForModel } from "@/actions/files";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Check auth
    // ...

    try {
        const contractId = parseInt(id);
        const rawContract = await db.query.contracts.findFirst({
            where: eq(contracts.id, contractId),
            with: {
                employee: true,
                tag_typeId: true,
                tag_categoryId: true,
                tag_statusId: true,
                tag_scheduleId: true, // Assuming this is the name in relations.ts
                user: true // assuming registeredBy maps to 'user' relation
            }
        });

        if (!rawContract) {
            return new NextResponse("Contract not found", { status: 404 });
        }

        const contract = {
            ...rawContract,
            type: rawContract.tag_typeId,
            category: rawContract.tag_categoryId,
            status: rawContract.tag_statusId,
            schedule: rawContract.tag_scheduleId,
            registeredBy: rawContract.user,
            tag_typeId: undefined,
            tag_categoryId: undefined,
            tag_statusId: undefined,
            tag_scheduleId: undefined,
            user: undefined
        };

        // Fetch associated files
        // Fetch associated files directly
        const rawFiles = await db
            .select({
                id: files.id,
                name: files.name,
                path: files.path,
                mimeType: files.mimeType,
                size: files.size,
                disk: files.disk,
                createdAt: files.createdAt,
            })
            .from(files)
            .innerJoin(filesLinks, eq(files.id, filesLinks.fileId))
            .where(and(
                eq(filesLinks.fileableId, contractId),
                or(
                    eq(filesLinks.fileableType, 'App\\Models\\Contract'),
                    eq(filesLinks.fileableType, 'App\\\\Models\\\\Contract')
                )
            ));

        const associatedFiles = await Promise.all(rawFiles.map(async (f) => ({
            ...f,
            url: await StorageService.getUrl(f.path)
        })));

        console.log(`[GET Contract] ID: ${contractId}, Files found: ${associatedFiles.length}`);

        return NextResponse.json({
            ...contract,
            files: associatedFiles
        });
    } catch (error) {
        console.error("Error fetching contract:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const contractId = parseInt(id);
        const body = await req.json();

        await db.update(contracts).set({
            employeeId: body.employee_id,
            typeId: body.type_id,
            categoryId: body.category_id,
            statusId: body.status_id,
            startDate: DateService.toDB(DateService.parseToDate(body.start_date))!,
            endDate: body.end_date ? DateService.toDB(DateService.parseToDate(body.end_date)) : null,
            scheduleId: body.schedule_id || null,
            amount: body.amount ? parseFloat(body.amount) : null,
            updatedAt: DateService.toISO(),
        }).where(eq(contracts.id, contractId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating contract:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const contractId = parseInt(id);
        await db.delete(contracts).where(eq(contracts.id, contractId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting contract:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
