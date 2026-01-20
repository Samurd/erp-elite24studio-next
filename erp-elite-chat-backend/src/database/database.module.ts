import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import * as relations from '../db/relations';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
    providers: [
        {
            provide: DATABASE_CONNECTION,
            useFactory: async () => {
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/elite',
                    // Connection pool configuration
                    max: 20, // Maximum number of clients in the pool
                    idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
                    connectionTimeoutMillis: 30000, // Return error if connection takes longer than 30 seconds
                    // Keep connections alive
                    keepAlive: true,
                    keepAliveInitialDelayMillis: 10000,
                });

                // Handle pool errors
                pool.on('error', (err) => {
                    console.error('Unexpected error on idle client', err);
                });

                return drizzle(pool, { schema: { ...schema, ...relations } });
            },
        },
    ],
    exports: [DATABASE_CONNECTION],
})
export class DatabaseModule { }
