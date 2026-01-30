
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

    try {
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

        // Validation - ensure fields exist if we are updating them fully
        if (subtotal === undefined || subtotal === null || total === undefined || total === null) {
            return new NextResponse("Missing required fields: subtotal or total", { status: 400 });
        }

        const subtotalNum = parseInt(subtotal);
        const totalNum = parseInt(total);

        if (isNaN(subtotalNum) || isNaN(totalNum)) {
            return new NextResponse("Invalid number format for subtotal or total", { status: 400 });
        }

        await db.update(payrolls)
            .set({
                employeeId: employee_id ? parseInt(employee_id) : null,
                subtotal: subtotalNum,
                bonos: bonos ? parseInt(bonos) : 0,
                deductions: deductions ? parseInt(deductions) : 0,
                total: totalNum,
                statusId: status_id ? parseInt(status_id) : null,
                observations: observations || null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(payrolls.id, payrollId));

        // Handle new attachments if any
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
    } catch (error: any) {
        console.error("Error updating payroll:", error);
        return new NextResponse(error.message || "Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payrollId = parseInt(id);

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    await db.delete(payrolls).where(eq(payrolls.id, payrollId));

    return NextResponse.json({ success: true });
}
