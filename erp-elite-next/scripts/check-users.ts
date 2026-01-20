import { db } from '../lib/db';
import { users } from '../drizzle/schema';

async function main() {
    const allUsers = await db.select().from(users);
    console.log('Users in DB:', allUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));
    process.exit(0);
}

main().catch(console.error);
