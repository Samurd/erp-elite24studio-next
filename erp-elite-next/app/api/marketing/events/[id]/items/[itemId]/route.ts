import { db } from "@/lib/db";
import { eventItems } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> } // Note: Route params are [id] (event id) and [itemId]
) {
    try {
        const { id, itemId } = await params;
        const body = await req.json();
        const {
            description,
            quantity,
            unit_id,
            unit_price,
            total_price,
        } = body;

        await db.update(eventItems)
            .set({
                description,
                quantity: parseFloat(quantity),
                unitId: parseInt(unit_id),
                unitPrice: parseFloat(unit_price),
                totalPrice: parseFloat(total_price),
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            })
            .where(and(
                eq(eventItems.id, parseInt(itemId)),
                eq(eventItems.eventId, parseInt(id)) // Ensure it belongs to the event
            ));

        return NextResponse.json({ message: "Ítem actualizado exitosamente" });
    } catch (error) {
        console.error("Error updating event item:", error);
        return NextResponse.json(
            { error: "Error updating event item" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id, itemId } = await params;

        await db.delete(eventItems).where(
            and(
                eq(eventItems.id, parseInt(itemId)),
                eq(eventItems.eventId, parseInt(id))
            )
        );

        return NextResponse.json({ message: "Ítem eliminado exitosamente" });
    } catch (error) {
        console.error("Error deleting event item:", error);
        return NextResponse.json(
            { error: "Error deleting event item" },
            { status: 500 }
        );
    }
}
