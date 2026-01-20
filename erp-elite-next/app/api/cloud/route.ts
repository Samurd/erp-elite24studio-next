import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders, files } from "@/drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";
import { getSignedUrl } from "@/lib/s3";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folderId = req.nextUrl.searchParams.get("folder");
    const userId = session.user.id;

    try {
        let currentFolder = null;
        let breadcrumbs: any[] = [];
        let foldersList: any[] = [];
        let filesList: any[] = [];

        if (folderId) {
            // Inside a folder
            const [folder] = await db
                .select()
                .from(folders)
                .where(eq(folders.id, parseInt(folderId)));

            if (!folder) {
                return NextResponse.json({ error: "Folder not found" }, { status: 404 });
            }

            currentFolder = folder;

            // Build breadcrumbs
            let curr = folder;
            while (curr) {
                breadcrumbs.unshift(curr);
                if (curr.parentId) {
                    const [parent] = await db
                        .select()
                        .from(folders)
                        .where(eq(folders.id, curr.parentId));
                    curr = parent;
                } else {
                    curr = null;
                }
            }

            // Get child folders
            foldersList = await db
                .select()
                .from(folders)
                .where(eq(folders.parentId, parseInt(folderId)));

            // Get child files
            const rawFiles = await db
                .select()
                .from(files)
                .where(eq(files.folderId, parseInt(folderId)));

            // Generate URLs for files (with presigned URLs for S3)
            filesList = await Promise.all(
                rawFiles.map(async (file) => {
                    let url: string;
                    if (file.disk === 's3') {
                        try {
                            url = await getSignedUrl(file.path, 3600);
                        } catch (error) {
                            console.error('Error generating presigned URL:', error);
                            url = file.path;
                        }
                    } else {
                        url = file.path.startsWith('http') ? file.path : `/${file.path}`;
                    }

                    return {
                        ...file,
                        url,
                        readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB'
                    };
                })
            );
        } else {
            // Root level
            foldersList = await db
                .select()
                .from(folders)
                .where(isNull(folders.parentId));

            const rawFiles = await db
                .select()
                .from(files)
                .where(isNull(files.folderId));

            // Generate URLs for files
            filesList = await Promise.all(
                rawFiles.map(async (file) => {
                    let url: string;
                    if (file.disk === 's3') {
                        try {
                            url = await getSignedUrl(file.path, 3600);
                        } catch (error) {
                            console.error('Error generating presigned URL:', error);
                            url = file.path;
                        }
                    } else {
                        url = file.path.startsWith('http') ? file.path : `/${file.path}`;
                    }

                    return {
                        ...file,
                        url,
                        readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB'
                    };
                })
            );
        }

        return NextResponse.json({
            folders: foldersList,
            files: filesList,
            currentFolder,
            breadcrumbs,
            canCreate: true // Simplified for now
        });
    } catch (error) {
        console.error("Error fetching cloud data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
