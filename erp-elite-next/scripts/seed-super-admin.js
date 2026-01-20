const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        // Create Super Admin role
        console.log('Creating Super Admin role...');
        const [roleResult] = await connection.query(`
            INSERT INTO roles (name, display_name, guard_name, created_at, updated_at)
            VALUES ('super_admin', 'Super Admin', 'web', NOW(), NOW())
            ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
        `);

        const superAdminId = roleResult.insertId;
        console.log(`✓ Super Admin role created (ID: ${superAdminId})\n`);

        // Get all permissions
        const [permissions] = await connection.query('SELECT id FROM permissions');
        console.log(`Found ${permissions.length} permissions`);

        // Assign all permissions to Super Admin
        console.log('Assigning all permissions to Super Admin...');
        for (const permission of permissions) {
            await connection.query(`
                INSERT IGNORE INTO role_has_permissions (role_id, permission_id)
                VALUES (?, ?)
            `, [superAdminId, permission.id]);
        }

        console.log(`✓ Assigned ${permissions.length} permissions to Super Admin\n`);
        console.log('✅ Super Admin role seeded successfully!');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
