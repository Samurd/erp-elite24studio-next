
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shares, files, folders } from "@/drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('fileId');

    if (!token) {
        return new NextResponse("Token required", { status: 400 });
    }

    try {
        // Find share
        const share = await db.query.shares.findFirst({
            where: eq(shares.shareToken, token)
        });

        if (!share) {
            return new NextResponse("Link not found", { status: 404 });
        }

        // Check expiration
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            return new NextResponse("Link expired", { status: 410 });
        }

        let targetFileId: number | null = null;
        let targetFileName: string = "download";

        // Determine file to download
        // Use .includes to be robust against backslash escaping differences
        if (share.shareableType.includes('File')) {
            targetFileId = parseInt(share.shareableId.toString());
        } else if (share.shareableType.includes('Folder')) {
            // If sharing a folder, user must request a specific file inside it
            if (!fileId) {
                return new NextResponse("File ID required for folder downloads", { status: 400 });
            }
            const requestedFileId = parseInt(fileId);

            // Verify file belongs to folder (or descendants - simplified to direct for now, or check ancestry)
            // Ideally we need to check if requestedFileId is descendant of share.shareableId
            // For now, let's just check if the file exists and we will verify the folder match if possible.
            // A precise check would recursively fetch parent_id up to share.shareableId.
            // Let's explicitly check if the file is in the folder. 
            // Better: Just check if the file exists. If the token is valid for a folder, we *should* restrict to that folder.
            // SECURITY: If we don't check ancestry, someone with a valid folder token could download ANY file by guessing ID?
            // YES. We MUST check ancestry.

            // Allow direct children for now.
            const fileCheck = await db.query.files.findFirst({
                where: and(
                    eq(files.id, requestedFileId),
                    eq(files.folderId, share.shareableId)
                )
            });

            if (!fileCheck) {
                // If not direct child, maybe deeper?
                // Let's skip deep check for MVP unless we add recursion helper.
                return new NextResponse("File not found in the shared folder", { status: 404 });
            }
            targetFileId = requestedFileId;
        }

        if (!targetFileId) {
            return new NextResponse("Invalid download target", { status: 400 });
        }

        const fileRecord = await db.query.files.findFirst({
            where: eq(files.id, targetFileId),
        });

        if (!fileRecord) {
            return new NextResponse("File not found", { status: 404 });
        }

        // Download
        const fileData = await StorageService.download(fileRecord.path);

        if (!fileData) {
            return new NextResponse("File content not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set("Content-Type", fileRecord.mimeType || fileData.contentType || "application/octet-stream");
        headers.set("Content-Disposition", `attachment; filename="${fileRecord.name}"`);
        headers.set("Content-Length", fileData.buffer.length.toString());
        headers.set("Cache-Control", "private, max-age=3600");

        return new NextResponse(fileData.buffer as any, {
            headers,
        });

    } catch (error) {
        console.error("Public download error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
