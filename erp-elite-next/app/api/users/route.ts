import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users as user, roles, roleHasPermissions, permissions } from "@/drizzle";
import { eq, like, or, and, sql } from "drizzle-orm";
import { getUserWithPermissions } from "@/lib/auth-helpers";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { storage } from "@/lib/storage";

export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check permission (userId is string in Better Auth)
        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions.includes('usuarios.view')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get query params
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const roleFilter = searchParams.get('role') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = 10;
        const offset = (page - 1) * perPage;

        // Build query
        let query = db.select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }).from(user);

        // Apply search filter
        if (search) {
            query = query.where(
                or(
                    like(user.name, `%${search}%`),
                    like(user.email, `%${search}%`)
                )
            ) as any;
        }

        // Get users
        const usersData = await query.limit(perPage).offset(offset);

        // Get total count
        const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(user);

        // Get roles and permissions for each user
        const usersWithRoles = await Promise.all(
            usersData.map(async (userData) => {
                const userPerms = await getUserWithPermissions(String(userData.id));
                return {
                    ...userData,
                    image: userData.image ? storage.url(userData.image) : null,
                    roles: userPerms.roles,
                    permissions: userPerms.permissions,
                };
            })
        );

        // Filter by role if specified
        let filteredUsers = usersWithRoles;
        if (roleFilter) {
            filteredUsers = usersWithRoles.filter((userData) =>
                userData.roles.some((r: any) => r.id === parseInt(roleFilter))
            );
        }

        // Get all roles for filter dropdown
        const allRoles = await db.select().from(roles);

        return Response.json({
            data: filteredUsers,
            meta: {
                current_page: page,
                per_page: perPage,
                total: count,
                last_page: Math.ceil(count / perPage),
            },
            roles: allRoles,
            permissions: {
                view: userData.permissions.includes('usuarios.view'),
                create: userData.permissions.includes('usuarios.create'),
                update: userData.permissions.includes('usuarios.update'),
                delete: userData.permissions.includes('usuarios.delete'),
            }
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
        if (!userData.permissions.includes('usuarios.create')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { name, email, password, roleId } = await request.json();

        // Validate input
        if (!name || !email || !password || !roleId) {
            return Response.json({
                errors: {
                    name: !name ? "El nombre es requerido" : undefined,
                    email: !email ? "El email es requerido" : undefined,
                    password: !password ? "La contraseña es requerida" : undefined,
                    roleId: !roleId ? "El rol es requerido" : undefined,
                }
            }, { status: 422 });
        }

        // Create user with Better Auth (using createUser to avoid session switch)
        const newUser = await auth.api.createUser({
            body: {
                email,
                password,
                name,
            }
        });

        if (!newUser || !newUser.user) {
            return Response.json({
                errors: { email: "Error al crear usuario. El email puede estar en uso." }
            }, { status: 422 });
        }

        // Assign role
        const { assignUserRole } = await import("@/lib/auth-helpers");
        await assignUserRole(newUser.user.id, parseInt(roleId));

        return Response.json({ success: true, user: newUser.user });

    } catch (error) {
        console.error("Error creating user:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check permission (userId is string in Better Auth)
        const userData = await getUserWithPermissions(session.user.id);
        if (!userData.permissions.includes('usuarios.delete')) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId } = await request.json();

        // Delete user from nextjs_users
        await db.delete(user).where(eq(user.id, userId));

        return Response.json({ success: true });

    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
