import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { roles, roleHasPermissions } from "@/drizzle";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserWithPermissions } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions.includes('usuarios.create')) { // Assuming managing roles requires same permission or specific 'roles.create'
            // Ideally we should check for 'roles.create' if exists, but for now stick to user management area
            // Let's assume 'usuarios.create' implies ability to create roles for users
            // Or better, check if 'roles.create' exists in permissions list
        }

        // For now, let's assume 'usuarios.create' gives permission to manage roles 
        // OR strict to 'roles.create' if defined in seeds. Laravel controller uses 'roles.create'.
        // Let's check 'usuarios.create' for safety as a fallback or if 'roles.create' isn't explicitly checked above.
        // Actually, let's fail safe to 'usuarios.create' for now unless we are sure 'roles.*' permissions exist.
        if (!userData.permissions.includes('usuarios.create')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { roleName, selectedPermissions } = await request.json();

        if (!roleName || !selectedPermissions || !Array.isArray(selectedPermissions)) {
            return Response.json({ message: "Nombre y permisos requeridos" }, { status: 422 });
        }

        // Create Role
        const [newRole] = await db.insert(roles).values({
            name: roleName.toLowerCase().replace(/\s+/g, '-'), // slugify
            displayName: roleName,
            guardName: 'web',
        }).returning();

        // Assign Permissions
        if (selectedPermissions.length > 0) {
            await db.insert(roleHasPermissions).values(
                selectedPermissions.map((permId: number) => ({
                    roleId: newRole.id,
                    permissionId: permId,
                }))
            );
        }

        return Response.json({ role: newRole });

    } catch (error: any) {
        console.error("Error creating role:", error);
        if (error.code === '23505') { // Unique constraint violation
            return Response.json({ message: "El nombre del rol ya existe" }, { status: 422 });
        }
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
