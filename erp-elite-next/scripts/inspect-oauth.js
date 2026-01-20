const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        console.log('📋 oauth_connections table structure:\n');
        const [columns] = await connection.query(`DESCRIBE oauth_connections`);
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
