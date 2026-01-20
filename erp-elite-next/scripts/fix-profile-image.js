const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL
    });

    try {
        const [rows] = await connection.execute("SELECT id, image FROM nextjs_users WHERE image LIKE 'https://%'");
        console.log(`Found ${rows.length} users with legacy image URLs.`);

        for (const user of rows) {
            // Strip domain prefix to get key
            // Prefix: https://api-minio.elite24studio.com.co/dev/
            // But let's be generic: split by /dev/ or just take everything after the bucket name or just regex
            // Assuming pattern matches Step 171 output: https://api-minio.elite24studio.com.co/dev/profile-photos/...
            // We want 'profile-photos/...'

            let newImage = user.image;
            if (user.image.includes('/dev/')) {
                newImage = user.image.split('/dev/')[1];
            } else {
                // Fallback or skip
                console.log(`Skipping complicated URL: ${user.image}`);
                continue;
            }

            if (newImage) {
                await connection.execute('UPDATE nextjs_users SET image = ? WHERE id = ?', [newImage, user.id]);
                console.log(`Updated user ${user.id}: ${user.image} -> ${newImage}`);
            }
        }
        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
