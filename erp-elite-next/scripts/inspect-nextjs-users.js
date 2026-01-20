const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL
    });

    try {
        const [rows] = await connection.execute('SELECT id, name, email, image FROM nextjs_users LIMIT 5');
        console.log('Next.js Users:', rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
