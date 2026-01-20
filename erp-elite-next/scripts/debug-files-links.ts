
import { db } from "@/lib/db";
import { filesLinks } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

async function main() {
    console.log("Fetching last 10 filesLinks...");

    // Use select() instead of query to avoid relation issues for now
    const links = await db.select().from(filesLinks).orderBy(desc(filesLinks.id)).limit(10);

    console.log("Last 10 Links:");
    links.forEach(l => {
        console.log(`ID: ${l.id}, File: ${l.fileId}, Type: '${l.fileableType}', ModelId: ${l.fileableId}`);
    });

    if (links.length > 0) {
        const lastType = links[0].fileableType;
        console.log("\nType Analysis of last entry:");
        console.log(`String value: ${lastType}`);
        console.log(`JSON stringified: ${JSON.stringify(lastType)}`);
        console.log(`Length: ${lastType.length}`);
    }
}

main().catch(console.error).then(() => process.exit(0));
