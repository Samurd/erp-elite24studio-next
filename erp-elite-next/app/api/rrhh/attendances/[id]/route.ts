
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attendances } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const attendanceSchema = z.object({
    employee_id: z.coerce.number(),
    date: z.string(),
    check_in: z.string(),
    check_out: z.string(),
    status_id: z.coerce.number().optional().nullable(),
    modality_id: z.coerce.number().optional().nullable(),
    observations: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const attendanceId = parseInt(id);

    try {
        const attendance = await db.query.attendances.findFirst({
            where: eq(attendances.id, attendanceId),
            with: {
                employee: true,
                status: true,
                modality: true,
            }
        });

        if (!attendance) {
            return new NextResponse("Attendance not found", { status: 404 });
        }

        return NextResponse.json(attendance);

    } catch (error) {
        console.error("Error fetching attendance details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const validated = attendanceSchema.parse(body);

        await db.update(attendances).set({
            employeeId: validated.employee_id,
            date: validated.date,
            checkIn: validated.check_in,
            checkOut: validated.check_out,
            statusId: validated.status_id || null,
            modalityId: validated.modality_id || null,
            observations: validated.observations || null,
        }).where(eq(attendances.id, parseInt(id)));

        return NextResponse.json({ message: "Asistencia actualizada exitosamente" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.errors), { status: 400 });
        }
        console.error("Error updating attendance:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        await db.delete(attendances).where(eq(attendances.id, parseInt(id)));
        return NextResponse.json({ message: "Asistencia eliminada exitosamente" });
    } catch (error) {
        console.error("Error deleting attendance:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
