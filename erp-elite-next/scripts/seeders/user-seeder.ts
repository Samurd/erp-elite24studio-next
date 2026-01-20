import { db } from "@/lib/db";
import { users, roles, userRoles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function seedUsers() {
    console.log("🌱 Seeding Users...");

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@domain.com';
    const adminName = process.env.ADMIN_NAME || 'Administrador';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';

    const supportEmail = process.env.SUPPORT_EMAIL || 'soporte@domain.com';
    const supportName = process.env.SUPPORT_NAME || 'Soporte';
    const supportPassword = process.env.SUPPORT_PASSWORD || 'supportpassword';

    const usersToSeed = [
        { email: adminEmail, name: adminName, password: adminPassword },
        { email: supportEmail, name: supportName, password: supportPassword },
    ];

    for (const userData of usersToSeed) {
        // Check if user exists
        let user = await db.query.users.findFirst({
            where: eq(users.email, userData.email),
        });

        // ... inside loop ...

        if (!user) {
            try {
                await auth.api.signUpEmail({
                    body: {
                        email: userData.email,
                        password: userData.password,
                        name: userData.name,
                    }
                });
                console.log(`Created user: ${userData.email} using Better Auth`);

                // Refetch created user
                user = await db.query.users.findFirst({
                    where: eq(users.email, userData.email),
                });
            } catch (error) {
                console.error(`Failed to create user ${userData.email}:`, error);
            }
        } else {
            console.log(`User ${userData.email} already exists.`);
        }

        // Assign Super Admin Role
        if (user) {
            // Find role
            const superAdminRole = await db.query.roles.findFirst({
                where: eq(roles.name, "super_admin"),
            });

            if (superAdminRole) {
                await db.insert(userRoles).values({
                    userId: user.id,
                    roleId: superAdminRole.id,
                }).onConflictDoNothing({ target: [userRoles.userId, userRoles.roleId] });
                console.log(`Assigned super_admin role to ${userData.email}`);
            }
        }
    }

    console.log("✅ Users seeded.");
}
