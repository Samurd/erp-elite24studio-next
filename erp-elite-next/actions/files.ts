'use server'

import { join } from "path";
import { db } from "@/lib/db";
import { files, filesLinks, folders, areas } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from "@/lib/storage-service";
import { DateService } from "@/lib/date-service";

// Helper to configure storage path for local storage
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "cloud");

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;
    const folderIdStr = formData.get("folderId") as string;
    const userIdStr = formData.get("userId") as string;
    const isModuleUploadStr = formData.get("isModuleUpload") as string;

    // Parse IDs if provided
    const folderId = folderIdStr ? parseInt(folderIdStr) : undefined;
    const isModuleUpload = isModuleUploadStr === 'true';

    // Get user ID from form data or from session
    let userId = userIdStr ? userIdStr : undefined;

    // If no userId provided, get from session (for audit purposes)
    if (!userId) {
        try {
            const { auth } = await import("@/lib/auth");
            const { headers } = await import("next/headers");
            const session = await auth.api.getSession({
                headers: await headers()
            });
            userId = session?.user?.id;
        } catch (error) {
            console.error("Could not get session for file upload:", error);
        }
    }

    if (!file) {
        throw new Error("No file provided");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const uniqueName = `${uuidv4()}.${extension}`;

    // Upload via StorageService
    const relativePath = `uploads/cloud/${uniqueName}`;

    const { path: filePath, url: fileUrl, disk } = await StorageService.upload(buffer, relativePath, file.type);

    // Create DB record
    const now = DateService.toISO();

    // For module uploads: folderId = null (won't appear in Mi Cloud)
    // And set userId = null to hide from getCloudData which filters by user
    const [insertedFile] = await db.insert(files).values({
        name: originalName,
        path: filePath,
        disk: disk,
        mimeType: file.type,
        size: file.size,
        folderId: isModuleUpload ? null : (folderId || null),
        userId: isModuleUpload ? null : (userId || null),
        createdAt: now,
        updatedAt: now,
    }).returning();

    if (!insertedFile || !insertedFile.id) {
        throw new Error("Failed to get inserted file ID");
    }

    const fileId = Number(insertedFile.id);

    return {
        success: true,
        file: {
            id: fileId,
            name: originalName,
            size: file.size,
            mimeType: file.type,
            url: fileUrl
        }
    };
}

// ... (existing imports)

export async function attachFileToModel(fileId: number, modelType: string, modelId: number, areaId?: number, areaSlug?: string) {
    try {
        let finalAreaId = areaId;

        if (!finalAreaId && areaSlug) {
            const area = await db.query.areas.findFirst({
                where: eq(areas.slug, areaSlug),
                columns: { id: true }
            });
            if (area) {
                finalAreaId = area.id;
            }
        }

        const now = DateService.toISO();
        await db.insert(filesLinks).values({
            fileId,
            fileableType: modelType,
            fileableId: modelId,
            areaId: finalAreaId || null,
            createdAt: now,
            updatedAt: now,
        });
        return { success: true };
    } catch (error: any) {
        // PostgreSQL duplicate key error (code 23505)
        // MySQL duplicate entry error (ER_DUP_ENTRY / errno 1062)
        if (error.code === '23505' ||
            error.code === 'ER_DUP_ENTRY' ||
            error.errno === 1062 ||
            error.cause?.code === '23505' ||
            error.cause?.code === 'ER_DUP_ENTRY' ||
            error.cause?.errno === 1062) {
            // If duplicate entry, consider it a success (idempotent)
            return { success: true };
        }
        console.error("Error attaching file:", error);
        return { success: false, error: "Failed to attach file" };
    }
}

export async function detachFileFromModel(fileId: number, modelType: string, modelId: number) {
    try {
        console.log(`[detachFileFromModel] Attempting to detach fileId=${fileId}, modelType=${modelType}, modelId=${modelId}`);
        const result = await db.delete(filesLinks)
            .where(
                and(
                    eq(filesLinks.fileId, fileId),
                    eq(filesLinks.fileableType, modelType),
                    eq(filesLinks.fileableId, modelId)
                )
            ).returning(); // Returning deleted rows to verify

        console.log(`[detachFileFromModel] Deleted rows:`, result);

        return { success: true };
    } catch (error) {
        console.error("Error detaching file:", error);
        return { success: false, error: "Failed to detach file" };
    }
}

export async function getFilesForModel(modelType: string, modelId: number) {
    // Query filesLinks where model matches
    const links = await db.query.filesLinks.findMany({
        where: and(
            eq(filesLinks.fileableType, modelType),
            eq(filesLinks.fileableId, modelId)
        ),
        with: {
            file: true
        }
    });

    // Map to flat file list with presigned URLs for S3 files
    const filesPromises = links.map(async (link) => {
        const f = link.file;
        if (!f) return null;

        // Generate URL based on disk type
        const url = await StorageService.getUrl(f.path);

        if (!url) return null; // Should not happen ideally if path exists

        return {
            id: f.id,
            name: f.name,
            size: f.size,
            mimeType: f.mimeType,
            path: f.path,
            url: url,
            createdAt: f.createdAt
        };
    });

    const results = await Promise.all(filesPromises);
    return results.filter(f => f !== null);
}

export async function getCloudData() {
    // Import auth and headers dynamically
    const { auth } = await import("@/lib/auth");
    const { headers } = await import("next/headers");

    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        throw new Error("Not authenticated");
    }

    const userId = session.user.id;

    // Only get user's own folders and files
    const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
    const allFiles = await db.select().from(files).where(eq(files.userId, userId));

    // Generate URLs for files (with presigned URLs for S3)
    const filesPromises = allFiles.map(async (f) => {
        const url = await StorageService.getUrl(f.path) || '';

        return {
            id: f.id,
            name: f.name,
            folder_id: f.folderId,
            size: f.size,
            readable_size: (f.size ? (f.size / 1024).toFixed(1) + ' KB' : '0 KB'),
            url: url
        };
    });

    const filesWithUrls = await Promise.all(filesPromises);

    return {
        folders: allFolders.map(f => ({
            id: f.id,
            name: f.name,
            parent_id: f.parentId
        })),
        files: filesWithUrls
    };
}

export async function deleteFile(fileId: number) {
    try {
        // 1. Get file info to know path
        const file = await db.query.files.findFirst({
            where: eq(files.id, fileId)
        });

        if (!file) {
            return { success: false, error: "File not found" };
        }

        // 2. Delete from Storage
        if (file.path) {
            await StorageService.delete(file.path);
        }

        // 3. Delete from DB
        await db.delete(filesLinks).where(eq(filesLinks.fileId, fileId));
        await db.delete(files).where(eq(files.id, fileId));

        return { success: true };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { success: false, error: "Failed to delete file" };
    }
}
