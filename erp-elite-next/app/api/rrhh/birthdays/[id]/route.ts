import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { birthdays } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        const birthday = await db.query.birthdays.findFirst({
            where: eq(birthdays.id, parseInt(id)),
            with: {
                employee: true,
                contact: true,
                responsible: true,
            },
        });

        if (!birthday) return new NextResponse("Birthday not found", { status: 404 });

        return NextResponse.json(birthday);
    } catch (error) {
        console.error("Error fetching birthday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        const body = await request.json();

        await db.update(birthdays).set({
            employeeId: body.is_employee ? parseInt(body.employee_id) : null,
            contactId: !body.is_employee ? parseInt(body.contact_id) : null,
            date: DateService.toDB(DateService.parseToDate(body.date))!,
            whatsapp: body.whatsapp || null,
            comments: body.comments || null,
            responsibleId: body.responsible_id || null, // UUID string
        }).where(eq(birthdays.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating birthday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });
        const { id } = await params;

        await db.delete(birthdays).where(eq(birthdays.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting birthday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
