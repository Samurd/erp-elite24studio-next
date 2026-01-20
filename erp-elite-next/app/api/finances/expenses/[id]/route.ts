import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await req.json();

        if (!body.name || !body.category_id || !body.date || !body.amount || !body.created_by_id || !body.result_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await db.update(expenses)
            .set({
                name: body.name,
                categoryId: parseInt(body.category_id),
                description: body.description,
                date: body.date,
                amount: parseInt(body.amount),
                createdById: body.created_by_id,
                resultId: parseInt(body.result_id),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(expenses.id, id));

        return NextResponse.json({ message: "Expense updated successfully" });
    } catch (error: any) {
        console.error("Error updating expense:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(expenses).where(eq(expenses.id, id));
        return NextResponse.json({ message: "Expense deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting expense:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
