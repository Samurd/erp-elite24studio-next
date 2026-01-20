import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSignedUrl, isS3Configured } from "@/lib/s3";
import { db } from "@/lib/db";
import { files } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
        return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    try {
        // Get file from database
        const [file] = await db.select().from(files).where(eq(files.id, parseInt(fileId)));

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // If file is on S3, generate presigned URL
        if (file.disk === 's3' && isS3Configured()) {
            const signedUrl = await getSignedUrl(file.path, 3600); // 1 hour expiration
            return NextResponse.json({ url: signedUrl });
        }

        // For local files, return the regular path
        const url = file.path.startsWith('http') ? file.path : `/${file.path}`;
        return NextResponse.json({ url });

    } catch (error) {
        console.error("Error generating file URL:", error);
        return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
    }
}
