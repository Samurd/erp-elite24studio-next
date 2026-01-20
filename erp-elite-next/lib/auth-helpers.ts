import { db } from "./db";
import { users as user, roles, permissions, roleHasPermissions, userRoles } from "@/drizzle";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Get user with their roles and permissions
 */
export async function getUserWithPermissions(userId: string) {
    // Get user from users
    const userResult = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const userData = userResult[0];

    if (!userData) {
        return {
            user: null,
            roles: [],
            permissions: [] as string[]
        };
    }

    // Get user roles via user_roles
    const userRolesResult = await db
        .select({
            id: roles.id,
            name: roles.name,
            displayName: roles.displayName,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));

    if (userRolesResult.length === 0) {
        return {
            user: userData,
            roles: [],
            permissions: [] as string[]
        };
    }

    // Get all permissions for user's roles
    const roleIds = userRolesResult.map(r => r.id);
    const userPermissions = await db
        .select({
            id: permissions.id,
            name: permissions.name,
        })
        .from(roleHasPermissions)
        .innerJoin(permissions, eq(roleHasPermissions.permissionId, permissions.id))
        .where(inArray(roleHasPermissions.roleId, roleIds));

    // Build permission slugs
    const permissionSlugs = userPermissions.map(p => p.name);

    return {
        user: userData,
        roles: userRolesResult,
        permissions: permissionSlugs,
        primaryRole: userRolesResult[0]?.displayName || null,
    };
}

/**
 * Assign role to user
 */
export async function assignUserRole(userId: string, roleId: number) {
    // Check if assignment already exists
    const existing = await db
        .select()
        .from(userRoles)
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            )
        )
        .limit(1);

    if (existing.length > 0) {
        return; // Already assigned
    }

    // Insert new role assignment
    await db.insert(userRoles).values({
        userId,
        roleId
    });
}

/**
 * Remove role from user
 */
export async function removeUserRole(userId: string, roleId: number) {
    await db
        .delete(userRoles)
        .where(
            and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId)
            )
        );
}
