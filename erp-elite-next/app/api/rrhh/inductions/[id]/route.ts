
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inductions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        const induction = await db.query.inductions.findFirst({
            where: eq(inductions.id, parseInt(id)),
            with: {
                employee: true,
                responsible: true,
                status: true,
                typeBond: true,
                confirmation: true
            }
        });

        if (!induction) {
            return new NextResponse("Induction not found", { status: 404 });
        }

        return NextResponse.json(induction);

    } catch (error) {
        console.error("Error fetching induction:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        const body = await req.json();

        await db.update(inductions).set({
            employeeId: body.employee_id,
            typeBondId: body.type_bond_id || null,
            entryDate: body.entry_date,
            responsibleId: body.responsible_id || null,
            date: body.date || null,
            statusId: body.status_id || null,
            confirmationId: body.confirmation_id || null,
            resource: body.resource || null,
            duration: body.duration || null,
            observations: body.observations || null,
        }).where(eq(inductions.id, parseInt(id)));

        return NextResponse.json({ message: "Inducción actualizada exitosamente" });

    } catch (error) {
        console.error("Error updating induction:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        await db.delete(inductions).where(eq(inductions.id, parseInt(id)));
        return NextResponse.json({ message: "Inducción eliminada exitosamente" });

    } catch (error) {
        console.error("Error deleting induction:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
