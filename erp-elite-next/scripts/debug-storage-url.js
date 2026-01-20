
require('dotenv').config();
const { S3Client } = require("@aws-sdk/client-s3"); // Just to emulate if needed, but not strictly required for logic test if we mock

// Mocking the Storage Driver logic from lib/storage.ts to isolate it and debug ENV vars
const AWS_BUCKET = process.env.AWS_BUCKET || "";
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || "";
const AWS_URL = process.env.AWS_URL;

console.log("--- ENV VARS ---");
console.log("AWS_BUCKET:", AWS_BUCKET);
console.log("AWS_ENDPOINT:", AWS_ENDPOINT);
console.log("AWS_URL:", AWS_URL);
console.log("----------------");

const testKey = "https://api-minio.elite24studio.com.co/dev/profile-photos/88360e88-bfd7-4826-b1cc-daac102d9579-PROTOTYPE-WEB-ELITE24-5-removebg-preview.png";

console.log("Test Key:", testKey);

function getUrl(key) {
    if (!key) return "";

    // Check if it's a legacy full URL pointing to our bucket
    const publicUrl = AWS_URL;

    if (key.startsWith("http")) {
        // If it matches our AWS_URL, proxy it
        if (publicUrl && key.startsWith(publicUrl)) {
            console.log("Match found via AWS_URL");
            let relativeKey = key.replace(publicUrl, "");
            // Remove leading slash if AWS_URL didn't have it but key did
            if (relativeKey.startsWith("/")) relativeKey = relativeKey.substring(1);
            return `/api/files/${relativeKey}`;
        }

        // Also check raw endpoint/bucket pattern just in case AWS_URL in env differs from DB 
        const bucketUrl = `${AWS_ENDPOINT}/${AWS_BUCKET}/`;
        console.log("Checking against bucketUrl:", bucketUrl);

        if (key.startsWith(bucketUrl)) {
            console.log("Match found via bucketUrl");
            let relativeKey = key.replace(bucketUrl, "");
            if (relativeKey.startsWith("/")) relativeKey = relativeKey.substring(1);
            return `/api/files/${relativeKey}`;
        }

        // External URL? Return as is (browser will try to load it).
        // If it's private but external, we can't proxy it easily without auth, so assume public.
        return key;
    }

    // It's a relative key
    return `/api/files/${key}`;
}

const result = getUrl(testKey);
console.log("Resulting URL:", result);
