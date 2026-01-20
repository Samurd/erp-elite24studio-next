
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inductions } from "@/drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const employeeId = searchParams.get("employeeId");
        const responsibleId = searchParams.get("responsibleId");
        const statusId = searchParams.get("statusId");
        const typeBondId = searchParams.get("typeBondId");
        const confirmationId = searchParams.get("confirmationId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const data = await db.query.inductions.findMany({
            where: (inductions, { eq, and, gte, lte }) => {
                const conditions = [];
                if (employeeId) conditions.push(eq(inductions.employeeId, parseInt(employeeId)));
                if (responsibleId) conditions.push(eq(inductions.responsibleId, parseInt(responsibleId)));
                if (statusId) conditions.push(eq(inductions.statusId, parseInt(statusId)));
                if (typeBondId) conditions.push(eq(inductions.typeBondId, parseInt(typeBondId)));
                if (confirmationId) conditions.push(eq(inductions.confirmationId, parseInt(confirmationId)));
                if (dateFrom) conditions.push(gte(inductions.date, dateFrom));
                if (dateTo) conditions.push(lte(inductions.date, dateTo));
                return and(...conditions);
            },
            with: {
                employee: true,
                responsible: true,
                status: true,
                typeBond: true,
                confirmation: true
            },
            orderBy: [desc(inductions.createdAt)]
        });

        // Manual search filtering
        const finalData = search ? data.filter(i =>
            i.employee?.fullName.toLowerCase().includes(search.toLowerCase()) ||
            i.observations?.toLowerCase().includes(search.toLowerCase())
        ) : data;

        return NextResponse.json({ data: finalData });

    } catch (error) {
        console.error("Error fetching inductions:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();

        // Basic Validation
        if (!body.employee_id || !body.entry_date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const newId = await db.insert(inductions).values({
            employeeId: body.employee_id,
            typeBondId: body.type_bond_id || null,
            entryDate: DateService.toDB(DateService.parseToDate(body.entry_date)),
            responsibleId: body.responsible_id || null,
            date: body.date ? DateService.toDB(DateService.parseToDate(body.date)) : null,
            statusId: body.status_id || null,
            confirmationId: body.confirmation_id || null,
            resource: body.resource || null,
            duration: body.duration || null,
            observations: body.observations || null,
        }).returning({ id: inductions.id });

        return NextResponse.json({ id: newId[0].id, message: "Inducción creada exitosamente" });

    } catch (error) {
        console.error("Error creating induction:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
