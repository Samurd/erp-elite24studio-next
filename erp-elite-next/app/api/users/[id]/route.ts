import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users as user, userRoles, accounts as account } from "@/drizzle";
import { eq, and } from "drizzle-orm";
import { getUserWithPermissions } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check permission
        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions?.includes("usuarios.update")) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const userId = params.id;
        const { name, email, password, roleId } = await request.json();

        // Validate input
        if (!name || !email || !roleId) {
            return Response.json({
                errors: {
                    name: !name ? "El nombre es requerido" : undefined,
                    email: !email ? "El email es requerido" : undefined,
                    roleId: !roleId ? "El rol es requerido" : undefined,
                }
            }, { status: 422 });
        }

        // Update user basic info
        await db.update(user)
            .set({
                name,
                email,
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            })
            .where(eq(user.id, userId));

        // Update password if provided
        if (password) {
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);

            await db.update(account)
                .set({ password: hashedPassword })
                .where(and(
                    eq(account.userId, userId),
                    eq(account.providerId, 'credential')
                ));
        }

        // Update role
        // First remove existing roles
        await db.delete(userRoles).where(eq(userRoles.userId, userId));

        // Then assign new role
        await db.insert(userRoles).values({
            userId,
            roleId: parseInt(roleId)
        });

        return Response.json({ success: true });

    } catch (error) {
        console.error("Error updating user:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
