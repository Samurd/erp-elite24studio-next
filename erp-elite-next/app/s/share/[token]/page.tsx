
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { shares, files, folders } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { FileIcon, FolderIcon, Download, AlertCircle } from "lucide-react";
import PublicFolderBrowser from "./components/PublicFolderBrowser";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

import { redirect } from "next/navigation";

// ...

export default async function PublicSharePage({
    params,
    searchParams
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ folderId?: string }>;
}) {
    const { token } = await params;
    const { folderId } = await searchParams;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // Redirect authenticated users to the internal view
    if (session) {
        let redirectUrl = `/cloud/share/${token}`;
        if (folderId) {
            redirectUrl += `?folder=${folderId}`;
        }
        redirect(redirectUrl);
    }

    // 1. Validate Token
    const share = await db.query.shares.findFirst({
        where: eq(shares.shareToken, token),
        with: {
            user_userId: {
                columns: {
                    name: true,
                    email: true
                }
            }
        }
    });

    if (!share) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Enlace no válido</h2>
                <p className="text-gray-500 mt-2">Este enlace no existe o ha sido eliminado.</p>
            </div>
        );
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertCircle className="w-16 h-16 text-orange-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800">Enlace expirado</h2>
                <p className="text-gray-500 mt-2">Este enlace ha caducado y ya no está disponible.</p>
            </div>
        );
    }

    // 2. Determine View (File or Folder)
    const isFolderShare = share.shareableType.includes('Folder');
    const rootId = parseInt(share.shareableId.toString());
    const shareName = isFolderShare ? 'Carpeta Compartida' : 'Archivo Compartido';

    let content = null;
    let currentFolderName = "";

    if (!isFolderShare) {
        // --- SINGLE FILE View ---
        const file = await db.query.files.findFirst({
            where: eq(files.id, rootId)
        });

        if (!file) return notFound();
        currentFolderName = file.name;

        content = (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center mt-8 space-y-6">
                <div className="bg-blue-50 p-6 rounded-full inline-block">
                    <FileIcon className="w-16 h-16 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{file.name}</h2>
                    <div className="text-gray-500 text-sm space-y-1">
                        <p>{formatBytes(file.size || 0)}</p>
                        <p>Compartido por {share.user_userId?.name}</p>
                    </div>
                </div>

                <a
                    href={`/api/public/download/${token}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
                >
                    <Download className="w-5 h-5" />
                    Descargar Archivo
                </a>
            </div>
        );

    } else {
        // --- FOLDER View ---
        let currentFolderId = rootId;

        // Fetch Root Folder
        const rootFolder = await db.query.folders.findFirst({
            where: eq(folders.id, rootId)
        });

        if (!rootFolder) return notFound();
        currentFolderName = rootFolder.name;

        let breadcrumbs = [{ id: rootId, name: rootFolder.name }];

        if (folderId) {
            const requestedId = parseInt(folderId);

            if (requestedId !== rootId) {
                // Breadcrumbs Logic
                let path = [];
                let checkId: number | null = requestedId;
                let isValid = false;
                let depth = 0;

                while (checkId && depth < 10) {
                    const f = await db.query.folders.findFirst({
                        where: eq(folders.id, checkId),
                        columns: { id: true, name: true, parentId: true }
                    });

                    if (!f) break;
                    path.unshift({ id: f.id, name: f.name });

                    if (f.id === rootId) {
                        isValid = true;
                        break;
                    }
                    if (f.parentId === null) break;
                    checkId = f.parentId;
                    depth++;
                }

                if (isValid) {
                    currentFolderId = requestedId;
                    breadcrumbs = path;
                }
            }
        }

        // Fetch Contents
        const currentFiles = await db.query.files.findMany({
            where: eq(files.folderId, currentFolderId)
        });

        const currentFolders = await db.query.folders.findMany({
            where: eq(folders.parentId, currentFolderId)
        });

        const displayFolderName = breadcrumbs[breadcrumbs.length - 1].name;

        content = (
            <PublicFolderBrowser
                token={token}
                folders={currentFolders}
                files={currentFiles}
                breadcrumbs={breadcrumbs}
                currentFolderName={displayFolderName}
                rootId={rootId}
            />
        );
    }

    return (
        <div className="space-y-6 w-full">
            {/* Conditional Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`p-2.5 rounded-lg ${isFolderShare ? 'bg-yellow-100/50' : 'bg-blue-100/50'}`}>
                        {isFolderShare ? <FolderIcon className="w-8 h-8 text-yellow-600" /> : <FileIcon className="w-8 h-8 text-blue-600" />}
                    </div>
                    {/* Title & Meta */}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">
                            {isFolderShare ? (currentFolderName || shareName) : (shareName)}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Compartido por</span>
                            <span className="font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                {share.user_userId?.name}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">{new Date(share.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Authentication Status */}
                {session ? (
                    <div className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full self-end sm:self-auto">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Viendo como</p>
                            <p className="text-sm font-medium text-gray-900 leading-none">{session.user.name}</p>
                        </div>
                        <Avatar className="h-8 w-8 border border-gray-200">
                            <AvatarImage src={session.user.image || undefined} />
                            <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                ) : (
                    <div className="flex gap-2 self-end sm:self-auto">
                        <Link
                            href={`/login?redirect=/s/share/${token}`}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Acceder al ERP
                        </Link>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="w-full">
                {content}
            </main>
        </div>
    );
}
