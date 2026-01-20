const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        // Check user
        const [users] = await connection.query(`
            SELECT id, email, name FROM nextjs_users WHERE email = 'admin@example.com'
        `);

        if (users.length === 0) {
            console.log('❌ User not found');
            return;
        }

        console.log('✓ User found:');
        console.log(`  ID: ${users[0].id}`);
        console.log(`  Email: ${users[0].email}`);
        console.log(`  Name: ${users[0].name}\n`);

        // Check account/password
        const [accounts] = await connection.query(`
            SELECT id, provider_id, password FROM nextjs_accounts WHERE user_id = ?
        `, [users[0].id]);

        if (accounts.length === 0) {
            console.log('❌ No account found for user');
            return;
        }

        console.log('✓ Account found:');
        console.log(`  Provider: ${accounts[0].provider_id}`);
        console.log(`  Password hash: ${accounts[0].password ? accounts[0].password.substring(0, 20) + '...' : 'NULL'}\n`);

        if (!accounts[0].password) {
            console.log('❌ Password is NULL!');
        } else if (!accounts[0].password.startsWith('$2')) {
            console.log('❌ Password hash format looks wrong (should start with $2)');
        } else {
            console.log('✓ Password hash format looks correct');
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
