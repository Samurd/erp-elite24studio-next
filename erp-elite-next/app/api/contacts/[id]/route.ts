import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/drizzle";
import { eq } from "drizzle-orm";
import { getUserWithPermissions } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({
                errors: {
                    name: !body.name ? "Requerido" : undefined,
                }
            }, { status: 422 });
        }

        if (body.firstContactDate && typeof body.firstContactDate === 'string') {
            body.firstContactDate = body.firstContactDate.slice(0, 10);
        }

        await db.update(contacts)
            .set({
                ...body,
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            })
            .where(eq(contacts.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error updating contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = parseInt(params.id);

        await db.delete(contacts).where(eq(contacts.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting contact:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
