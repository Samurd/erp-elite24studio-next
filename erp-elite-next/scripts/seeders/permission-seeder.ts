import { db } from "@/lib/db";
import { areas, permissions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedPermissions() {
    console.log("🌱 Seeding Permissions...");

    // Fetch all areas effectively using select() to avoid relation dependency issues for now
    const allAreas = await db.select().from(areas);

    const actions = ['view', 'create', 'update', 'delete'];

    for (const area of allAreas) {
        for (const action of actions) {
            let fullName = `${area.slug}.${action}`;

            // Manual parent lookup
            if (area.parentId) {
                const parent = allAreas.find(a => a.id === area.parentId);
                if (parent) {
                    fullName = `${parent.slug}.${area.slug}.${action}`;
                }
            }

            // Check if permission exists manually because 'name' might not have unique constraint in schema
            const existingPermission = await db.query.permissions.findFirst({
                where: eq(permissions.name, fullName)
            });

            if (!existingPermission) {
                await db.insert(permissions).values({
                    name: fullName,
                    action: action,
                    areaId: area.id,
                    guardName: 'web', // From Laravel
                });
            }
        }
    }

    console.log("✅ Permissions seeded.");
}
