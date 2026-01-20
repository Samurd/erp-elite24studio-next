
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Disabling FK checks and wiping chat tables...");

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);

    await db.execute(sql`TRUNCATE TABLE message_mentions;`);
    await db.execute(sql`TRUNCATE TABLE message_reactions;`);
    await db.execute(sql`TRUNCATE TABLE messages;`);
    await db.execute(sql`TRUNCATE TABLE private_chat_user;`);
    // await db.execute(sql`TRUNCATE TABLE private_chats;`); // Optional if we want to nukes chats too. Schema says private_chat_user references privateChats. Let's keep chats? No, if users change, chats are invalid.
    await db.execute(sql`TRUNCATE TABLE private_chats;`);

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    console.log("Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
