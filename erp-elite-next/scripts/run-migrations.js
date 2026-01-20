#!/usr/bin/env node

/**
 * Migration Runner for Production
 * 
 * This script runs all pending SQL migrations in the drizzle/migrations directory.
 * It's safe to run multiple times as migrations are idempotent.
 * 
 * Usage:
 *   npm run migrate                    # Run in production
 *   npm run migrate:dev                # Run in development (Docker)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../drizzle/migrations');
const DB_URL = process.env.DATABASE_URL || 'mysql://root:@127.0.0.1:3307/elite';

// Parse DATABASE_URL to get connection details
function parseDbUrl(url) {
    const match = url.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }
    return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5]
    };
}

function runMigrations() {
    console.log('🚀 Starting migrations...\n');

    // Get all .sql files in migrations directory
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Run in alphabetical order

    if (migrationFiles.length === 0) {
        console.log('✅ No migrations to run');
        return;
    }

    const db = parseDbUrl(DB_URL);
    const mysqlCmd = `mysql -h${db.host} -P${db.port} -u${db.user} ${db.password ? `-p${db.password}` : ''} ${db.database}`;

    migrationFiles.forEach((file, index) => {
        const filePath = path.join(MIGRATIONS_DIR, file);
        console.log(`📝 Running migration ${index + 1}/${migrationFiles.length}: ${file}`);

        try {
            execSync(`${mysqlCmd} < ${filePath}`, {
                stdio: 'inherit',
                encoding: 'utf-8'
            });
            console.log(`✅ ${file} completed\n`);
        } catch (error) {
            console.error(`❌ Error running ${file}:`, error.message);
            process.exit(1);
        }
    });

    console.log('🎉 All migrations completed successfully!');
}

// Run migrations
try {
    runMigrations();
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
}
