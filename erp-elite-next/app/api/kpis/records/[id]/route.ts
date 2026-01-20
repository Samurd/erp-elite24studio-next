
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kpiRecords, filesLinks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { format } from "date-fns";

const kpiRecordSchema = z.object({
    record_date: z.string().min(1),
    value: z.number(),
    observation: z.string().optional().nullable(),
    pending_file_ids: z.array(z.number()).optional(), // New files to add
});

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
        const validatedData = kpiRecordSchema.parse(body);

        await db.update(kpiRecords)
            .set({
                recordDate: validatedData.record_date,
                value: String(validatedData.value),
                observation: validatedData.observation,
                updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            })
            .where(eq(kpiRecords.id, id));

        // Handle new files linking
        if (validatedData.pending_file_ids && validatedData.pending_file_ids.length > 0) {
            for (const fileId of validatedData.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: fileId,
                    kpiRecordId: id,
                    createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                    updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating KPI record:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Error updating KPI record" }, { status: 500 });
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

        await db.delete(kpiRecords).where(eq(kpiRecords.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting KPI record:", error);
        return NextResponse.json({ error: "Error deleting KPI record" }, { status: 500 });
    }
}
