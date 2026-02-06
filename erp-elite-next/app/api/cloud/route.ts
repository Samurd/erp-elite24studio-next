import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { folders, files, shares, teamUser, users } from "@/drizzle/schema";
import { eq, isNull, and, or, inArray, sql, ne } from "drizzle-orm";
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
        let sharedFoldersList: any[] = [];
        let sharedFilesList: any[] = [];
        let canCreate = true;

        // Get user's teams for share checks
        const userTeams = await db
            .select({ teamId: teamUser.teamId })
            .from(teamUser)
            .where(eq(teamUser.userId, userId));

        const teamIds = userTeams.map(t => t.teamId);

        if (folderId) {
            // Inside a folder
            const [folder] = await db
                .select()
                .from(folders)
                .where(eq(folders.id, parseInt(folderId)));

            if (!folder) {
                return NextResponse.json({ error: "Folder not found" }, { status: 404 });
            }

            // Check access: Owner OR Shared
            const isOwner = folder.userId === userId;

            // Check if shared with user directly or via team (only matters if not owner)
            let sharePermission: string | null = null;
            if (!isOwner) {
                const shareCheck = await db
                    .select()
                    .from(shares)
                    .where(and(
                        eq(shares.shareableType, 'App\\\\Models\\\\Folder'),
                        eq(shares.shareableId, folder.id),
                        or(
                            eq(shares.sharedWithUserId, userId),
                            teamIds.length > 0 ? inArray(shares.sharedWithTeamId, teamIds) : undefined
                        )
                    ))
                    .limit(1);

                if (shareCheck.length > 0) {
                    sharePermission = shareCheck[0].permission;
                }
            }

            const hasAccess = isOwner || sharePermission !== null;

            if (!hasAccess) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }

            // CRITICAL: Owner ALWAYS has 'edit' permission, regardless of any shares
            const permission = isOwner ? 'edit' : sharePermission;

            // canCreate is only false if NOT owner AND shared with view-only
            if (!isOwner && sharePermission === 'view') {
                canCreate = false;
            }

            currentFolder = { ...folder, permission, ownerName: isOwner ? 'Me' : 'Shared' };

            // Build breadcrumbs - but only show folders the user can navigate to
            // For non-owners, we need to find the "root" of their access (the shared folder)
            let curr = folder;
            let sharedRootId: number | null = null;

            // First, if not owner, find which folder is the shared root
            if (!isOwner) {
                // Find the highest-level folder in the ancestor chain that is shared with this user
                let temp = folder;
                let tempId = folder.id;
                while (temp) {
                    // Check if this folder is directly shared with the user
                    const directShare = await db
                        .select()
                        .from(shares)
                        .where(and(
                            eq(shares.shareableType, 'App\\\\Models\\\\Folder'),
                            eq(shares.shareableId, temp.id),
                            or(
                                eq(shares.sharedWithUserId, userId),
                                teamIds.length > 0 ? inArray(shares.sharedWithTeamId, teamIds) : undefined
                            )
                        ))
                        .limit(1);

                    if (directShare.length > 0) {
                        sharedRootId = temp.id;
                    }

                    if (temp.parentId) {
                        const [parent] = await db
                            .select()
                            .from(folders)
                            .where(eq(folders.id, temp.parentId));
                        temp = parent;
                    } else {
                        break;
                    }
                }
            }

            // Now build breadcrumbs, stopping at sharedRootId for non-owners
            while (curr) {
                breadcrumbs.unshift(curr);

                // If this is the shared root for non-owners, stop here
                if (!isOwner && sharedRootId && curr.id === sharedRootId) {
                    break;
                }

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

            // Get child folders (Only show folders created by the folder owner? Or mixed? 
            // Usually in a folder, you see what's in it. 
            // If I am looking at someone else's folder, I see what THEY put in it.)

            // We assume content of a folder belongs to the folder structure, 
            // but we should check if we need to filter further? 
            // Standard behavior: If I have access to folder, I see its children.

            const rawFolders = await db
                .select()
                .from(folders)
                .where(eq(folders.parentId, parseInt(folderId)));

            // Add permission to child folders (inherit from parent)
            foldersList = rawFolders.map(f => ({
                ...f,
                permission: permission || 'edit'
            }));

            // Get child files
            const rawFiles = await db
                .select()
                .from(files)
                .where(eq(files.folderId, parseInt(folderId)));

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
                        readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB',
                        permission: permission || 'edit' // Inherit permission from folder, default to edit if owner
                    };
                })
            );
        } else {
            // Root level - Show MY files/folders
            foldersList = await db
                .select()
                .from(folders)
                .where(and(
                    isNull(folders.parentId),
                    eq(folders.userId, userId) // STRICTLY my folders
                ));

            const rawFiles = await db
                .select()
                .from(files)
                .where(and(
                    isNull(files.folderId),
                    eq(files.userId, userId) // STRICTLY my files
                ));

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
                        readable_size: file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB',
                        permission: 'edit',
                        ownerName: 'Me'
                    };
                })
            );

            // Fetch Shared Items
            const sharedFolderShares = await db
                .select({
                    share: shares,
                    folder: folders,
                    owner: users
                })
                .from(shares)
                .innerJoin(folders, eq(shares.shareableId, folders.id))
                .leftJoin(users, eq(folders.userId, users.id))
                .where(and(
                    eq(shares.shareableType, 'App\\\\Models\\\\Folder'),
                    ne(folders.userId, userId), // Exclude my own folders
                    or(
                        eq(shares.sharedWithUserId, userId),
                        teamIds.length > 0 ? inArray(shares.sharedWithTeamId, teamIds) : undefined
                    )
                ));

            // Deduplicate folders (user might have multiple shares for same folder e.g. individual + team)
            const uniqueSharedFolders = new Map();
            sharedFolderShares.forEach(item => {
                if (!uniqueSharedFolders.has(item.folder.id)) {
                    uniqueSharedFolders.set(item.folder.id, {
                        ...item.folder,
                        permission: item.share.permission,
                        ownerName: item.owner ? item.owner.name : 'Unknown'
                    });
                } else {
                    // Try to give the most permissive if multiple? 
                    // 'edit' > 'view'. If existing is view and current is edit, upgrade.
                    if (item.share.permission === 'edit') {
                        uniqueSharedFolders.get(item.folder.id).permission = 'edit';
                    }
                }
            });
            sharedFoldersList = Array.from(uniqueSharedFolders.values());


            const sharedFileShares = await db
                .select({
                    share: shares,
                    file: files,
                    owner: users
                })
                .from(shares)
                .innerJoin(files, eq(shares.shareableId, files.id))
                .leftJoin(users, eq(files.userId, users.id))
                .where(and(
                    eq(shares.shareableType, 'App\\\\Models\\\\File'),
                    ne(files.userId, userId), // Exclude my own files
                    or(
                        eq(shares.sharedWithUserId, userId),
                        teamIds.length > 0 ? inArray(shares.sharedWithTeamId, teamIds) : undefined
                    )
                ));

            const uniqueSharedFiles = new Map();

            // Process shared files url generation
            await Promise.all(sharedFileShares.map(async (item) => {
                if (!uniqueSharedFiles.has(item.file.id)) {
                    let url: string;
                    if (item.file.disk === 's3') {
                        try {
                            url = await getSignedUrl(item.file.path, 3600);
                        } catch (error) {
                            console.error('Error generating presigned URL:', error);
                            url = item.file.path;
                        }
                    } else {
                        url = item.file.path.startsWith('http') ? item.file.path : `/${item.file.path}`;
                    }

                    uniqueSharedFiles.set(item.file.id, {
                        ...item.file,
                        url,
                        readable_size: item.file.size ? `${(item.file.size / 1024).toFixed(1)} KB` : '0 KB',
                        permission: item.share.permission,
                        ownerName: item.owner ? item.owner.name : 'Unknown'
                    });
                }
            }));
            sharedFilesList = Array.from(uniqueSharedFiles.values());
        }

        return NextResponse.json({
            folders: foldersList,
            files: filesList,
            sharedFolders: sharedFoldersList,
            sharedFiles: sharedFilesList,
            currentFolder,
            breadcrumbs,
            canCreate
        });
    } catch (error) {
        console.error("Error fetching cloud data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
