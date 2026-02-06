
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders, files, shares } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getSignedUrl } from "@/lib/s3";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const { token } = await params;
    const folderId = req.nextUrl.searchParams.get("folder");

    try {
        const share = await db.query.shares.findFirst({
            where: eq(shares.shareToken, token),
            with: {
                user_userId: {
                    columns: { name: true }
                }
            }
        });

        if (!share) {
            return NextResponse.json({ error: "Invalid token" }, { status: 404 });
        }

        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Token expired" }, { status: 410 });
        }

        const isFolderShare = share.shareableType.includes('Folder');
        const rootId = parseInt(share.shareableId.toString());
        const sharePermission = share.permission || 'view';

        let currentFolder = null;
        let breadcrumbs: any[] = [];
        let foldersList: any[] = [];
        let filesList: any[] = [];

        if (!isFolderShare) {
            const file = await db.query.files.findFirst({
                where: eq(files.id, rootId)
            });
            if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

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

            filesList = [{
                ...file,
                url,
                readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB',
                permission: sharePermission,
                ownerName: share.user_userId?.name
            }];
        } else {
            let currentFolderId = rootId;
            let viewingSubfolder = false;

            if (folderId) {
                const requestedId = parseInt(folderId);
                if (requestedId !== rootId) {
                    currentFolderId = requestedId;
                    viewingSubfolder = true;
                }
            }

            const folderObj = await db.query.folders.findFirst({
                where: eq(folders.id, currentFolderId)
            });

            if (!folderObj) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

            let curr = folderObj;
            let safeGuard = 0;
            let foundRoot = false;
            let tempBreadcrumbs = [];

            while (curr && safeGuard < 15) {
                tempBreadcrumbs.unshift({ id: curr.id, name: curr.name });
                if (curr.id === rootId) {
                    foundRoot = true;
                    break;
                }
                if (!curr.parentId) break;

                const parent = await db.query.folders.findFirst({
                    where: eq(folders.id, curr.parentId)
                });
                if (!parent) break;
                curr = parent;
                safeGuard++;
            }

            if (viewingSubfolder && !foundRoot) {
                return NextResponse.json({ error: "Access denied or Invalid Path" }, { status: 403 });
            }

            breadcrumbs = tempBreadcrumbs;
            currentFolder = { ...folderObj, permission: sharePermission, ownerName: share.user_userId?.name };

            foldersList = await db.query.folders.findMany({
                where: eq(folders.parentId, currentFolderId)
            });

            const rawFiles = await db.query.files.findMany({
                where: eq(files.folderId, currentFolderId)
            });

            filesList = await Promise.all(
                rawFiles.map(async (file) => {
                    let url: string;
                    if (file.disk === 's3') {
                        try {
                            url = await getSignedUrl(file.path, 3600);
                        } catch (error) {
                            url = file.path;
                        }
                    } else {
                        url = file.path.startsWith('http') ? file.path : `/${file.path}`;
                    }
                    return {
                        ...file,
                        url,
                        readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB',
                        permission: sharePermission
                    };
                })
            );
        }

        return NextResponse.json({
            folders: foldersList,
            files: filesList,
            sharedFolders: [],
            sharedFiles: [],
            currentFolder: currentFolder,
            breadcrumbs,
            canCreate: sharePermission === 'edit'
        });

    } catch (error) {
        console.error("Error fetching shared cloud data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
