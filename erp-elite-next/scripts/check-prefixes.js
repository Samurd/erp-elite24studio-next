const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        const [rows] = await connection.query('SELECT name FROM permissions');
        const prefixes = new Set();
        rows.forEach(row => {
            if (row.name.includes('.')) {
                prefixes.add(row.name.split('.')[0]);
            } else {
                prefixes.add(row.name);
            }
        });
        console.log('Unique prefixes found:', Array.from(prefixes).sort());
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
