import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users as user } from "@/drizzle";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email } = await request.json();

        // Validation
        if (!name || !email) {
            return NextResponse.json({
                errors: {
                    name: !name ? "Requerido" : undefined,
                    email: !email ? "Requerido" : undefined
                }
            }, { status: 422 });
        }

        // Check if email is already taken by another user (if changed)
        if (email !== session.user.email) {
            const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
            if (existingUser.length > 0) {
                return NextResponse.json({
                    errors: { email: "Este correo ya está en uso." }
                }, { status: 422 });
            }
        }

        // Update User
        await db.update(user)
            .set({
                name,
                email,
                updatedAt: new Date().toISOString()
            })
            .where(eq(user.id, session.user.id));

        return NextResponse.json({ success: true, message: "Profile updated" });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
