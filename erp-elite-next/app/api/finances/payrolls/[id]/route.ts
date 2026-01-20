
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payrolls } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getFilesForModel, attachFileToModel } from "@/actions/files";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payrollId = parseInt(id);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const item = await db.query.payrolls.findFirst({
        where: eq(payrolls.id, payrollId),
        with: {
            employee: true,
            status: true,
        },
    });

    if (!item) {
        return new NextResponse("Not Found", { status: 404 });
    }

    // Fetch files
    const files = await getFilesForModel("App\\Models\\Payroll", payrollId);

    return NextResponse.json({
        ...item,
        files: files || []
    });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payrollId = parseInt(id);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    let payload;
    try {
        payload = await request.json();
    } catch (e) {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const {
        employee_id,
        subtotal,
        bonos,
        deductions,
        total,
        status_id,
        observations,
        pending_file_ids,
    } = payload;

    await db.update(payrolls)
        .set({
            employeeId: employee_id ? parseInt(employee_id) : null,
            subtotal: parseInt(subtotal),
            bonos: bonos ? parseInt(bonos) : 0,
            deductions: deductions ? parseInt(deductions) : 0,
            total: parseInt(total),
            statusId: status_id ? parseInt(status_id) : null,
            observations: observations || null,
            updatedAt: new Date().toISOString(),
        })
        .where(eq(payrolls.id, payrollId));

    // Handle new attachments if any (though usually edit mode uses Attachment component directly)
    // But Form.vue might send pending_file_ids if standard logic is used.
    // In `NormsFormModal` I used `ModelAttachmentsCreator` which emits `pendingFileIds`.
    if (pending_file_ids && Array.isArray(pending_file_ids)) {
        for (const fileId of pending_file_ids) {
            await attachFileToModel(
                typeof fileId === 'string' ? parseInt(fileId) : fileId,
                "App\\Models\\Payroll",
                payrollId
            );
        }
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payrollId = parseInt(id);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    await db.delete(payrolls).where(eq(payrolls.id, payrollId));

    return NextResponse.json({ success: true });
}
