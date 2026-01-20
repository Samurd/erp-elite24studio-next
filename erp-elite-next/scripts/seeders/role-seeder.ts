import { db } from "@/lib/db";
import { roles, permissions, roleHasPermissions, teamRoles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedRoles() {
    console.log("🌱 Seeding Roles...");

    // Super Admin Role
    const existingSuperAdmin = await db.query.roles.findFirst({
        where: eq(roles.name, "super_admin"),
    });

    if (!existingSuperAdmin) {
        await db.insert(roles).values({
            name: "super_admin",
            displayName: "Super Admin",
            guardName: "web",
        });
    }

    const superAdminRole = await db.query.roles.findFirst({
        where: eq(roles.name, "super_admin"),
    });

    if (superAdminRole) {
        // Assign ALL permissions to Super Admin
        const allPermissions = await db.select().from(permissions);

        for (const perm of allPermissions) {
            // Check if permission is already assigned
            const existingAssignment = await db.query.roleHasPermissions.findFirst({
                where: (table, { and, eq }) => and(eq(table.permissionId, perm.id), eq(table.roleId, superAdminRole.id))
            });

            if (!existingAssignment) {
                await db.insert(roleHasPermissions).values({
                    permissionId: perm.id,
                    roleId: superAdminRole.id,
                });
            }
        }
    }

    console.log("✅ Roles seeded.");
}

export async function seedTeamRoles() {
    console.log("🌱 Seeding Team Roles...");

    const rolesToAdd = [
        { slug: 'owner', name: 'Propietario' },
        { slug: 'member', name: 'Miembro' }
    ];

    for (const role of rolesToAdd) {
        const existing = await db.query.teamRoles.findFirst({
            where: eq(teamRoles.slug, role.slug)
        });

        if (!existing) {
            await db.insert(teamRoles).values({
                slug: role.slug,
                name: role.name,
            });
        }
    }

    console.log("✅ Team Roles seeded.");
}
