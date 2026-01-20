import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { files } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return new NextResponse("File ID required", { status: 400 });
    }

    const fileId = parseInt(id);
    if (isNaN(fileId)) {
        return new NextResponse("Invalid File ID", { status: 400 });
    }

    try {
        const fileRecord = await db.query.files.findFirst({
            where: eq(files.id, fileId),
        });

        if (!fileRecord) {
            return new NextResponse("File not found in database", { status: 404 });
        }

        // Use StorageService to download file (Proxy)
        const fileData = await StorageService.download(fileRecord.path);

        if (!fileData) {
            return new NextResponse("File not found in storage", { status: 404 });
        }

        const headers = new Headers();
        // Prefer DB mimeType, fallback to S3/detected
        headers.set("Content-Type", fileRecord.mimeType || fileData.contentType || "application/octet-stream");
        headers.set("Content-Disposition", `attachment; filename="${fileRecord.name}"`);
        headers.set("Content-Length", fileData.buffer.length.toString());
        // Add cache control
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(fileData.buffer, {
            headers,
        });

    } catch (error) {
        console.error("Download error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
