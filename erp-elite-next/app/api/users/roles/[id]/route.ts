import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, roleHasPermissions, permissions } from "@/drizzle";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserWithPermissions } from "@/lib/auth-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const roleId = parseInt(id);

        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const [role] = await db.select().from(roles).where(eq(roles.id, roleId));

        if (!role) {
            return Response.json({ error: "Role not found" }, { status: 404 });
        }

        // Get permissions
        const rolePermissions = await db
            .select({
                id: permissions.id,
                name: permissions.name,
            })
            .from(roleHasPermissions)
            .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
            .where(eq(roleHasPermissions.roleId, roleId));

        return Response.json({
            ...role,
            permissions: rolePermissions
        });

    } catch (error) {
        console.error("Error fetching role:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const roleId = parseInt(id);

        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        // Check permission
        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions.includes('usuarios.update')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { roleName, selectedPermissions } = await request.json();

        // Update Role
        const [updatedRole] = await db.update(roles)
            .set({
                displayName: roleName,
                // optionally update name/slug usually we don't for existing systems unless requested
                // name: roleName.toLowerCase().replace(/\s+/g, '-'), 
            })
            .where(eq(roles.id, roleId))
            .returning();

        // Sync Permissions: Delete all and insert new
        await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));

        if (selectedPermissions && selectedPermissions.length > 0) {
            await db.insert(roleHasPermissions).values(
                selectedPermissions.map((permId: number) => ({
                    roleId: roleId,
                    permissionId: permId,
                }))
            );
        }

        return Response.json({ role: updatedRole });

    } catch (error) {
        console.error("Error updating role:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const roleId = parseInt(id);

        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        // Check permission
        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions.includes('usuarios.delete')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete Role (Cascades usually handle relations, but manual cleanup is safer if not fully cascaded in DB)
        // Schema says onDelete: cascade for role_has_permissions
        await db.delete(roles).where(eq(roles.id, roleId));

        return Response.json({ success: true });

    } catch (error) {
        console.error("Error deleting role:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
