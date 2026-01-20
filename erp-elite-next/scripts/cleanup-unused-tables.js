const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    const tablesToDrop = [
        'auth_verification',
        'auth_account',
        'auth_session',
        'auth_user',
        'role_permissions' // Esta también si existe
    ];

    try {
        console.log('🗑️  Dropping unused tables...\n');

        for (const table of tablesToDrop) {
            try {
                await connection.query(`DROP TABLE IF EXISTS ${table}`);
                console.log(`✓ Dropped table: ${table}`);
            } catch (e) {
                console.log(`✗ Could not drop ${table}: ${e.message}`);
            }
        }

        console.log('\n✅ Cleanup completed!');
        console.log('\n📋 Remaining tables will be the original Laravel/Spatie ones.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
