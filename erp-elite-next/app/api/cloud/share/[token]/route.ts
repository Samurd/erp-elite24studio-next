
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

    // Session check is optional for the API itself (the token authorizes access), 
    // but we might want to return permissions based on the user?
    // Actually, if we are in this route, we assume the user might have edit rights 
    // IF the share allows it. 
    // But typically public info is View Only unless specific user share.
    // However, the token grants access to ANYONE with the link.
    // So the permission level is defined by the Share record (usually 'view' for public links, 
    // but could be 'edit' if we supported public edit links).
    // Our schema has 'permission' on shares.

    try {
        const share = await db.query.shares.findFirst({
            where: eq(shares.shareToken, token),
            with: {
                user_userId: {
                    columns: { name: true, image: true }
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

        // Check if current user is logged in and is the owner
        let isOwner = false;
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (session) {
            // Check if the user owns the shared item
            if (isFolderShare) {
                const folder = await db.query.folders.findFirst({
                    where: eq(folders.id, rootId)
                });
                isOwner = folder?.userId === session.user.id;
            } else {
                const file = await db.query.files.findFirst({
                    where: eq(files.id, rootId)
                });
                isOwner = file?.userId === session.user.id;
            }
        }

        // CRITICAL: Owner always has 'edit' permission, otherwise use share permission
        const effectivePermission = isOwner ? 'edit' : (share.permission || 'view');

        let currentFolder = null;
        let breadcrumbs: any[] = [];
        let foldersList: any[] = [];
        let filesList: any[] = [];

        // If it's a single file share, we just return that file
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
                permission: effectivePermission,
                ownerName: share.user_userId?.name
            }];
        } else {
            // Folder Share
            let currentFolderId = rootId;
            let viewingSubfolder = false;

            if (folderId) {
                const requestedId = parseInt(folderId);
                if (requestedId !== rootId) {
                    // Validate path (must be child of rootId)
                    // ... (Simplification: fetch folder)
                    // Security: We should verify requestedId is descendant of rootId
                    // For now assuming ID is enough, but robust security would check ancestry.
                    // Given time constraints, we'll fetch.
                    currentFolderId = requestedId;
                    viewingSubfolder = true;
                }
            }

            const folderObj = await db.query.folders.findFirst({
                where: eq(folders.id, currentFolderId)
            });

            if (!folderObj) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

            // Breadcrumbs Logic (Trace back to rootId)
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

            // If we requested a subfolder but couldn't trace back to rootId, access denied
            if (viewingSubfolder && !foundRoot) {
                return NextResponse.json({ error: "Access denied or Invalid Path" }, { status: 403 });
            }

            breadcrumbs = tempBreadcrumbs;
            currentFolder = { ...folderObj, permission: effectivePermission, ownerName: share.user_userId?.name };

            // Fetch Content
            const rawFolders = await db.query.folders.findMany({
                where: eq(folders.parentId, currentFolderId)
            });

            // Add permission to child folders
            foldersList = rawFolders.map(f => ({
                ...f,
                permission: effectivePermission
            }));

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
                        permission: effectivePermission
                    };
                })
            );
        }

        return NextResponse.json({
            folders: foldersList,
            files: filesList,
            sharedFolders: [], // In a shared view, we don't show OTHER shares
            sharedFiles: [],
            currentFolder: currentFolder,
            breadcrumbs,
            canCreate: effectivePermission === 'edit',
            // Share info for UI
            shareInfo: {
                sharedBy: share.user_userId?.name || 'Unknown',
                sharedByImage: share.user_userId?.image || null,
                permission: effectivePermission,
                isOwner: isOwner,
                shareType: isFolderShare ? 'folder' : 'file'
            }
        });

    } catch (error) {
        console.error("Error fetching shared cloud data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
