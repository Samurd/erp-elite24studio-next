const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected to database.\n');

    try {
        console.log('Creating Next.js auth tables...\n');

        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nextjs_users (
                id VARCHAR(36) PRIMARY KEY,
                name TEXT NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                image TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Created nextjs_users table');

        // Sessions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nextjs_sessions (
                id VARCHAR(36) PRIMARY KEY,
                expires_at TIMESTAMP NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                user_id VARCHAR(36) NOT NULL,
                FOREIGN KEY (user_id) REFERENCES nextjs_users(id) ON DELETE CASCADE
            );
        `);
        console.log('✓ Created nextjs_sessions table');

        // Accounts table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nextjs_accounts (
                id VARCHAR(36) PRIMARY KEY,
                account_id TEXT NOT NULL,
                provider_id TEXT NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                access_token TEXT,
                refresh_token TEXT,
                id_token TEXT,
                access_token_expires_at TIMESTAMP,
                refresh_token_expires_at TIMESTAMP,
                scope TEXT,
                password TEXT,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES nextjs_users(id) ON DELETE CASCADE
            );
        `);
        console.log('✓ Created nextjs_accounts table');

        // Verifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nextjs_verifications (
                id VARCHAR(36) PRIMARY KEY,
                identifier TEXT NOT NULL,
                value TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
        `);
        console.log('✓ Created nextjs_verifications table');

        // User-Roles junction table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS nextjs_user_roles (
                user_id VARCHAR(36) NOT NULL,
                role_id BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY (user_id, role_id),
                FOREIGN KEY (user_id) REFERENCES nextjs_users(id) ON DELETE CASCADE,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
            );
        `);
        console.log('✓ Created nextjs_user_roles table');

        console.log('\n✅ All Next.js auth tables created successfully!');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

main();
