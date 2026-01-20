const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        const [rows] = await connection.query('SELECT * FROM permissions');
        console.log('Permissions found:', rows);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
