const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        // Delete existing test user if exists
        await connection.query(`DELETE FROM nextjs_user_roles WHERE user_id IN (SELECT id FROM nextjs_users WHERE email = 'admin@example.com')`);
        await connection.query(`DELETE FROM nextjs_accounts WHERE user_id IN (SELECT id FROM nextjs_users WHERE email = 'admin@example.com')`);
        await connection.query(`DELETE FROM nextjs_users WHERE email = 'admin@example.com'`);
        console.log('✓ Cleaned up existing test user\n');

        // User credentials
        const userId = uuidv4();
        const email = 'admin@example.com';
        const password = 'password123';
        const name = 'Super Admin';

        // Hash password with bcrypt (10 rounds like Better Auth default)
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating Super Admin user...');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('');

        // Insert user into nextjs_users
        await connection.query(`
            INSERT INTO nextjs_users (id, name, email, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, TRUE, NOW(), NOW())
        `, [userId, name, email]);
        console.log('✓ User created in nextjs_users');

        // Insert credential account (Better Auth format)
        const accountId = uuidv4();
        await connection.query(`
            INSERT INTO nextjs_accounts (
                id, 
                account_id, 
                provider_id, 
                user_id, 
                password, 
                created_at, 
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            accountId,
            email,           // account_id should be the email for credential provider
            'credential',    // provider_id must be 'credential' for email/password
            userId,
            hashedPassword
        ]);
        console.log('✓ Credential account created in nextjs_accounts');

        // Get Super Admin role ID
        const [roles] = await connection.query(`
            SELECT id FROM roles WHERE name = 'super_admin' LIMIT 1
        `);

        if (roles.length === 0) {
            console.log('⚠️  Super Admin role not found. Run seed-super-admin.js first!');
            console.log('   User created but no role assigned.\n');
        } else {
            const superAdminRoleId = roles[0].id;

            // Assign Super Admin role to user
            await connection.query(`
                INSERT INTO nextjs_user_roles (user_id, role_id)
                VALUES (?, ?)
            `, [userId, superAdminRoleId]);
            console.log('✓ Super Admin role assigned');
        }

        console.log('\n✅ Super Admin user created successfully!');
        console.log('\n📋 Login credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log('\n🔐 IMPORTANT: Change the password after first login!');

    } catch (e) {
        console.error('❌ Error:', e.message);
        console.error(e);
    } finally {
        await connection.end();
    }
}

main();
