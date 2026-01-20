
import { db } from '@/lib/db';
import { filesLinks } from '@/drizzle/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.select({
    type: filesLinks.fileableType,
    count: sql`count(*)`
  }).from(filesLinks).groupBy(filesLinks.fileableType);
  
  console.log('Stored fileableTypes:', result);
  process.exit(0);
}

main().catch(console.error);

