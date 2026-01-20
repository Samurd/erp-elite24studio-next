import "dotenv/config";
import { seedTagCategories } from "./seeders/tag-category-seeder";
import { seedTags } from "./seeders/tag-seeder";
import { seedAreas } from "./seeders/area-seeder";
import { seedPermissions } from "./seeders/permission-seeder";
import { seedRoles, seedTeamRoles } from "./seeders/role-seeder";
import { seedUsers } from "./seeders/user-seeder";
import { db } from "@/lib/db";
import { pool } from "@/lib/db";
// Note: We might need to close the pool manually if the script doesn't exit.
// But lib/db exports 'db' which wraps the pool. Accessing pool directly might require export adjustment or just let process exit.
// Update: lib/db uses a global pool or exports it? Let's check lib/db content again if needed.
// For now, assuming process.exit() handles it.

async function main() {
    try {
        await seedTagCategories();
        await seedTags();
        await seedAreas();
        await seedPermissions(); // Relies on Areas
        await seedRoles();       // Relies on Permissions (creates super_admin and assigns perms)
        await seedTeamRoles();
        await seedUsers();       // Relies on Roles

        console.log("🌱 Database seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
}

main();
