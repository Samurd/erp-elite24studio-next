import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// Helper to stream body
function iteratorToStream(iterator: any) {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                controller.enqueue(value);
            }
        },
    });
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    // Await params as per Next.js 15+ requirements
    const { path } = await context.params;

    if (!path || path.length === 0) {
        return new NextResponse("File not found", { status: 404 });
    }

    let key = path.join("/");

    // Robustness: If the path segments included 'api/files' (due to double prefixing or request routing), strip it.
    // We expect key to be e.g. "profile-photos/image.png"
    if (key.startsWith("api/files/")) {
        key = key.replace("api/files/", "");
    }

    // Check if we are using S3 driver, because Local driver serves from /public/uploads/ automatically via Nginx/Next.js static files.
    // But our storage.ts might route local files here too if we want uniform access?
    // Actually, S3StorageDriver.url() will point here. LocalStorageDriver.url() points to /uploads/...
    // So this route is primarily for S3 Proxy.

    // We need to access the S3 client directly or via storage service.
    // The storage service "driver" is private. We might need to expose a "getStream" or similar method.
    // For now, let's instantiate S3 Client here or modify storage.ts to export a `getFile` method.
    // Modifying storage.ts is cleaner.

    try {
        // We will assume storage.ts has a getFileStream or similar, OR we act as a "S3 specific" proxy if checking env.
        // Let's modify storage.ts to include `getStream(path): Promise<{ stream: ReadableStream, contentType: string }>`.

        // TEMPORARY: Direct S3 access here to avoid huge refactor cycle of storage.ts right this second, 
        // BUT the cleaner way is adding `getStream` to storage driver interface.
        // Let's do that. It makes it truly scalable.

        console.log("File Proxy Request for Key:", key);
        console.log("Using bucket:", process.env.AWS_BUCKET);
        const fileData = await storage.getStream(key);

        if (!fileData) {
            return new NextResponse("File not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Type", fileData.contentType || "application/octet-stream");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new NextResponse(fileData.stream as any, {
            headers,
        });

    } catch (error: any) {
        console.error("File proxy error:", error);
        if (error.name === "NoSuchKey") {
            return new NextResponse("File not found", { status: 404 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
