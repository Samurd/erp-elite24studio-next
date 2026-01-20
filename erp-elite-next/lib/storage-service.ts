import { getSignedUrl, s3Client, AWS_BUCKET, AWS_URL } from "./s3";
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export class StorageService {
    private static get driver() {
        return process.env.FILESYSTEM_DRIVER || 'local';
    }

    /**
     * Get the full URL for a file path based on the configured driver.
     * @param path - The relative file path (e.g. from database)
     * @returns The full URL (signed for S3, public path for local)
     */
    static async getUrl(path: string | null | undefined): Promise<string | null> {
        if (!path) return null;

        // If path is already a full URL (http/https), return it
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Pass through existing valid paths
        if (path.startsWith('/storage/') || path.startsWith('/api/files/')) {
            return path;
        }

        try {
            if (this.driver === 's3') {
                return await getSignedUrl(path);
            } else {
                // Local driver: assume public storage exposed at /storage
                // Ensure path doesn't start with / to avoid double slashes if prefix adds one
                const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                return `/storage/${cleanPath}`;
            }
        } catch (error) {
            console.error(`[StorageService] Error generating URL for path ${path}:`, error);
            // Fallback to local or return null
            return null;
        }
    }

    /**
     * Upload a file to the configured storage.
     * @param buffer - File content
     * @param path - Destination path (relative)
     * @param mimeType - File mime type
     * @returns Object containing the stored path, public url and used disk
     */
    static async upload(buffer: Buffer, path: string, mimeType: string): Promise<{ path: string, url: string, disk: string }> {
        try {
            if (this.driver === 's3') {
                await s3Client.send(new PutObjectCommand({
                    Bucket: AWS_BUCKET,
                    Key: path,
                    Body: buffer,
                    ContentType: mimeType,
                }));

                return {
                    path: path,
                    url: `${AWS_URL}${path}`,
                    disk: 's3'
                };
            } else {
                // Local Storage
                // Map storage paths to public/storage or similar
                // Laravel typically links public/storage to storage/app/public.
                // Here we will save to public/uploads by default or respecting the path passed.
                // Assuming path passed is like "uploads/cloud/filename.ext"
                // We will save to "public/storage/uploads/cloud/filename.ext" to match the /storage URL

                // IMPORTANT: Next.js serves 'public' folder at root. 
                // Currently user uses 'public/uploads'. Let's stick to 'public/storage' as per getUrl logic which returns /storage/...

                const absPath = join(process.cwd(), "public", "storage", path);
                const dir = absPath.substring(0, absPath.lastIndexOf('/'));

                await mkdir(dir, { recursive: true });
                await writeFile(absPath, buffer);

                return {
                    path: path,
                    url: `/storage/${path}`,
                    disk: 'local'
                };
            }
        } catch (error) {
            console.error(`[StorageService] Upload failed:`, error);
            throw error;
        }
    }

    /**
     * Delete a file from storage.
     * @param path - Relative path to delete
     */
    static async delete(path: string): Promise<void> {
        try {
            if (this.driver === 's3') {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: AWS_BUCKET,
                    Key: path,
                }));
            } else {
                const absPath = join(process.cwd(), "public", "storage", path);
                if (existsSync(absPath)) {
                    await unlink(absPath);
                }
            }
        } catch (error) {
            console.error(`[StorageService] Delete failed for ${path}:`, error);
            // Don't throw, just log.
        }
    }
    /**
     * Download a file from storage.
     * @param path - Relative path to download
     * @returns Object containing buffer and content type
     */
    static async download(path: string): Promise<{ buffer: Buffer, contentType: string } | null> {
        try {
            if (this.driver === 's3') {
                const response = await s3Client.send(new GetObjectCommand({
                    Bucket: AWS_BUCKET,
                    Key: path,
                }));

                if (!response.Body) return null;

                // Convert stream to buffer
                const byteArray = await response.Body.transformToByteArray();
                const buffer = Buffer.from(byteArray);

                return {
                    buffer,
                    contentType: response.ContentType || 'application/octet-stream'
                };
            } else {
                // Local Storage
                let absPath = join(process.cwd(), "public", "storage", path);

                // Fallback check
                if (!existsSync(absPath)) {
                    const fallback = join(process.cwd(), "public", path);
                    if (existsSync(fallback)) {
                        absPath = fallback;
                    } else {
                        return null;
                    }
                }

                const buffer = await readFile(absPath);
                // We'd ideally guess mime type here if not stored, but caller usually has it from DB.
                // For now return generic or let caller handle it.
                return {
                    buffer,
                    contentType: 'application/octet-stream' // Caller should override with DB mimeType
                };
            }
        } catch (error) {
            console.error(`[StorageService] Download failed for ${path}:`, error);
            return null;
        }
    }
}
