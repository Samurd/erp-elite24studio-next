const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        // Get first user
        const [users] = await connection.query(`
            SELECT id, email, name FROM nextjs_users ORDER BY created_at ASC LIMIT 1
        `);

        if (users.length === 0) {
            console.log('❌ No users found in nextjs_users table');
            console.log('   Please register at: http://localhost:3000/register');
            return;
        }

        const user = users[0];
        console.log(`✓ Found user: ${user.name} (${user.email})`);
        console.log(`  User ID: ${user.id}\n`);

        // Get Super Admin role
        const [roles] = await connection.query(`
            SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
        `);

        if (roles.length === 0) {
            console.log('❌ Super Admin role not found');
            console.log('   Run: node scripts/seed-super-admin.js');
            return;
        }

        const superAdminRoleId = roles[0].id;
        console.log(`✓ Found Super Admin role (ID: ${superAdminRoleId})\n`);

        // Check if role already assigned
        const [existing] = await connection.query(`
            SELECT * FROM nextjs_user_roles WHERE user_id = ? AND role_id = ?
        `, [user.id, superAdminRoleId]);

        if (existing.length > 0) {
            console.log('✓ Super Admin role already assigned to this user');
        } else {
            // Assign Super Admin role
            await connection.query(`
                INSERT INTO nextjs_user_roles (user_id, role_id)
                VALUES (?, ?)
            `, [user.id, superAdminRoleId]);
            console.log('✓ Super Admin role assigned successfully!');
        }

        console.log('\n✅ Setup complete!');
        console.log(`\n📋 User "${user.name}" now has Super Admin role (112 permissions)`);
        console.log(`   Login at: http://localhost:3000/login`);
        console.log(`   Email: ${user.email}`);

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
