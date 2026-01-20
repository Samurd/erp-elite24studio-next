const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log('--- Expenses Table ---');
        const [expenses] = await connection.query('DESCRIBE expenses');
        console.log(expenses);

        console.log('\n--- Incomes Table ---');
        const [incomes] = await connection.query('DESCRIBE incomes');
        console.log(incomes);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
