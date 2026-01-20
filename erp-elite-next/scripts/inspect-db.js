const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        // Get all tables
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📋 Existing tables in database:\n');

        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`${index + 1}. ${tableName}`);
        });

        console.log('\n\n🔍 Checking for Spatie tables...\n');

        // Check for Spatie-specific tables
        const spatieTables = ['roles', 'permissions', 'model_has_roles', 'model_has_permissions', 'role_has_permissions'];

        for (const tableName of spatieTables) {
            const [result] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
            if (result.length > 0) {
                console.log(`✓ ${tableName} exists`);

                // Show structure
                const [columns] = await connection.query(`DESCRIBE ${tableName}`);
                console.log(`  Columns:`);
                columns.forEach(col => {
                    console.log(`    - ${col.Field} (${col.Type})`);
                });
                console.log('');
            } else {
                console.log(`✗ ${tableName} does not exist`);
            }
        }

        // Check users table
        console.log('\n👤 Checking users table...\n');
        const [userColumns] = await connection.query(`DESCRIBE users`);
        console.log('Users table columns:');
        userColumns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`);
        });

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
