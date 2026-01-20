import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

// Check if S3 is configured
export const isS3Configured = () => {
    return process.env.FILESYSTEM_DRIVER === 's3' &&
        !!process.env.AWS_ACCESS_KEY_ID &&
        !!process.env.AWS_SECRET_ACCESS_KEY &&
        !!process.env.AWS_BUCKET;
};

// Create S3 client
export const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.AWS_ENDPOINT,
    forcePathStyle: process.env.AWS_USE_PATH_STYLE_ENDPOINT === 'true',
});

export const AWS_BUCKET = process.env.AWS_BUCKET || '';
export const AWS_URL = process.env.AWS_URL || '';

/**
 * Generate a presigned URL for accessing a private S3 object
 * @param key - The S3 object key (path)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL
 */
export async function getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: AWS_BUCKET,
        Key: key,
    });

    return await awsGetSignedUrl(s3Client, command, { expiresIn });
}
