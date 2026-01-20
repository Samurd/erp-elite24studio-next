import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

// Storage Driver Interface
interface StorageDriver {
    upload(file: File | Blob, path: string): Promise<string>;
    delete(path: string): Promise<void>;
    url(path: string): string;
    getStream(path: string): Promise<{ stream: ReadableStream | Readable | Blob | Buffer; contentType: string } | null>;
}

// S3 Driver
class S3StorageDriver implements StorageDriver {
    private client: S3Client;
    private bucket: string;
    private endpoint: string;
    // private publicUrl: string; // Not used for proxy mode

    constructor() {
        this.bucket = process.env.AWS_BUCKET || "";
        this.endpoint = process.env.AWS_ENDPOINT || "";
        // this.publicUrl = process.env.AWS_URL || "";

        this.client = new S3Client({
            region: process.env.AWS_DEFAULT_REGION || "us-east-1",
            endpoint: this.endpoint,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === "true",
        });
    }

    async upload(file: File | Blob, folder: string): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = 'name' in file ? (file as File).name : "blob";
        const filename = `${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "")}`;
        const key = `${folder}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: file.type,
            // ACL: "public-read" as ObjectCannedACL, // Removed ACL reliance for private buckets
        });

        await this.client.send(command);

        return key; // Return KEY, not URL
    }

    async delete(key: string): Promise<void> {
        // Handle full URLs by stripping the public URL prefix
        let dbKey = key;
        const publicUrl = process.env.AWS_URL;
        if (publicUrl && key.startsWith(publicUrl)) {
            dbKey = key.replace(publicUrl, "");
        } else if (key.startsWith("http")) {
            // Try to extract if it matches endpoint/bucket pattern fallback
            // Format: https://endpoint/bucket/key
            const bucketUrl = `${this.endpoint}/${this.bucket}/`;
            if (key.startsWith(bucketUrl)) {
                dbKey = key.replace(bucketUrl, "");
            }
        }

        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: dbKey,
        });

        await this.client.send(command);
    }

    url(key: string): string {
        if (!key) return "";

        // Check if it's a legacy full URL pointing to our bucket
        let publicUrl = process.env.AWS_URL; // e.g. https://api-minio.../dev/

        if (key.startsWith("http")) {
            // Normalize publicUrl (remove trailing slash)
            if (publicUrl && publicUrl.endsWith("/")) {
                publicUrl = publicUrl.slice(0, -1);
            }

            // If it matches our AWS_URL, proxy it
            if (publicUrl && key.startsWith(publicUrl)) {
                let relativeKey = key.replace(publicUrl, "");
                // Remove leading slash if AWS_URL didn't have it but key did
                if (relativeKey.startsWith("/")) relativeKey = relativeKey.substring(1);
                return `/api/files/${relativeKey}`;
            }

            // Also check raw endpoint/bucket pattern just in case AWS_URL in env differs from DB 
            // Normalize endpoint
            let endpoint = this.endpoint;
            if (endpoint.endsWith("/")) endpoint = endpoint.slice(0, -1);

            // Build bucket URL variants
            const bucketUrl = `${endpoint}/${this.bucket}`;

            if (key.startsWith(bucketUrl)) {
                let relativeKey = key.replace(bucketUrl, "");
                if (relativeKey.startsWith("/")) relativeKey = relativeKey.substring(1);
                return `/api/files/${relativeKey}`;
            }

            // Try matching without protocol if endpoint has it
            if (endpoint.includes("://")) {
                const bareEndpoint = endpoint.split("://")[1];
                const bareBucketUrl = `https://${bareEndpoint}/${this.bucket}`; // assume https for minio typically
                if (key.startsWith(bareBucketUrl)) {
                    let relativeKey = key.replace(bareBucketUrl, "");
                    if (relativeKey.startsWith("/")) relativeKey = relativeKey.substring(1);
                    return `/api/files/${relativeKey}`;
                }
            }

            // External URL? Return as is (browser will try to load it).
            // If it's private but external, we can't proxy it easily without auth, so assume public.
            return key;
        }

        // It's a relative key
        return `/api/files/${key}`;
    }

    async getStream(key: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.client.send(command);
            return {
                stream: response.Body as unknown as ReadableStream, // response.Body in AWS SDK v3 is complex, but castable for NextResponse
                contentType: response.ContentType || "application/octet-stream",
            };
        } catch (e) {
            console.error("S3 getStream error", e);
            return null;
        }
    }
}

// Local Filesystem Driver
class LocalStorageDriver implements StorageDriver {
    private uploadDir: string;
    private publicUrl: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), "public", "uploads");
        this.publicUrl = "/storage";

        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async upload(file: File | Blob, folder: string): Promise<string> {
        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = 'name' in file ? (file as File).name : "blob";
        const filename = `${uuidv4()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "")}`;

        // Ensure folder exists
        const targetDir = path.join(this.uploadDir, folder);
        console.log("LocalStorageDriver: targetDir", targetDir);

        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                console.error("LocalStorageDriver: mkdir error", e);
                throw e;
            }
        }

        const filePath = path.join(targetDir, filename);
        console.log("LocalStorageDriver: writing to", filePath);

        try {
            fs.writeFileSync(filePath, buffer);
        } catch (e) {
            console.error("LocalStorageDriver: write error", e);
            throw e;
        }

        return `${folder}/${filename}`; // Return KEY
    }

    async delete(key: string): Promise<void> {
        // If it looks like a full URL, strip it?
        // simple heuristic:
        let cleanKey = key;
        if (key.startsWith(this.publicUrl)) {
            cleanKey = key.replace(this.publicUrl, "").replace(/^\//, "");
        }

        const filePath = path.join(this.uploadDir, cleanKey);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    url(key: string): string {
        if (!key) return "";
        if (key.startsWith("http")) return key;

        const cleanPath = key.startsWith('/') ? key : `/${key}`;
        return `${this.publicUrl}${cleanPath}`;
    }

    async getStream(key: string) {
        // Local strategy doesn't need proxy usually, but if we want to use the /api/files route for local too (consistency):
        // We can implemented it.
        // But LocalStorageDriver.url() returns `/uploads/key`, which is served by Next.js/Nginx directly.
        // So this might not be called unless we force /api/files/ even for local.
        // Let's implement it just in case.

        const filePath = path.join(this.uploadDir, key);
        if (!fs.existsSync(filePath)) return null;

        const stream = fs.createReadStream(filePath);
        // Detect MIME type? For now simpler.
        return {
            stream: stream,
            contentType: "application/octet-stream"
        };
    }
}

// Factory / Singleton
class StorageService {
    private driver: StorageDriver;

    constructor() {
        const driverName = process.env.FILESYSTEM_DRIVER || "local";
        if (driverName === "s3") {
            this.driver = new S3StorageDriver();
        } else {
            this.driver = new LocalStorageDriver();
        }
    }

    async upload(file: File | Blob, path: string): Promise<string> {
        return this.driver.upload(file, path);
    }

    async delete(path: string): Promise<void> {
        return this.driver.delete(path);
    }

    url(path: string): string {
        return this.driver.url(path);
    }

    async getStream(path: string) {
        return this.driver.getStream(path);
    }
}

export const storage = new StorageService();
