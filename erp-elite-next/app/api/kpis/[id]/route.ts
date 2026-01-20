
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kpis } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { format } from "date-fns";
import { DateService } from "@/lib/date-service";

const kpiSchema = z.object({
    indicator_name: z.string().min(1),
    target_value: z.number().nullable().optional(),
    periodicity_days: z.number().min(1),
    role_id: z.number(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const kpi = await db.query.kpis.findFirst({
            where: eq(kpis.id, id),
            with: {
                role: true,
            },
        });

        if (!kpi) {
            return NextResponse.json({ error: "KPI not found" }, { status: 404 });
        }

        return NextResponse.json(kpi);
    } catch (error) {
        console.error("Error fetching KPI:", error);
        return NextResponse.json({ error: "Error fetching KPI" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await req.json();
        const validatedData = kpiSchema.parse(body);

        await db.update(kpis)
            .set({
                indicatorName: validatedData.indicator_name,
                targetValue: validatedData.target_value ? Number(validatedData.target_value) : null,
                periodicityDays: validatedData.periodicity_days,
                roleId: validatedData.role_id,
                updatedAt: DateService.toISO(),
            })
            .where(eq(kpis.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating KPI:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Error updating KPI" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idString } = await params;
        const id = parseInt(idString);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        await db.delete(kpis).where(eq(kpis.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting KPI:", error);
        return NextResponse.json({ error: "Error deleting KPI" }, { status: 500 });
    }
}
