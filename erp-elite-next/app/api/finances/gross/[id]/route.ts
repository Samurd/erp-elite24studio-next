import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await req.json();

        // Validation based on Laravel controller
        if (!body.name || !body.type_id || !body.date || !body.amount || !body.created_by_id || !body.result_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.update(incomes)
            .set({
                name: body.name,
                typeId: parseInt(body.type_id),
                categoryId: body.category_id ? parseInt(body.category_id) : null,
                description: body.description,
                date: body.date,
                amount: parseInt(body.amount),
                createdById: body.created_by_id,
                resultId: parseInt(body.result_id),
            })
            .where(eq(incomes.id, id));

        return NextResponse.json({ message: "Income updated successfully" });
    } catch (error: any) {
        console.error("Error updating gross income:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(incomes).where(eq(incomes.id, id));
        return NextResponse.json({ message: "Income deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting gross income:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
