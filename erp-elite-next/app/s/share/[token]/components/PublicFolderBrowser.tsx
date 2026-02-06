
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
    FileIcon,
    FolderIcon,
    Download,
    Search,
    ArrowUpDown,
    ChevronRight,
    Home,
    FileText,
    Image as ImageIcon,
    Music,
    Video,
    Code
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface FileItem {
    id: number;
    name: string;
    size: number;
    mimeType: string | null;
    updatedAt: string | null;
}

interface FolderItem {
    id: number;
    name: string;
    updatedAt: string | null;
}

interface BreadcrumbType {
    id: number;
    name: string;
}

interface PublicFolderBrowserProps {
    token: string;
    folders: FolderItem[];
    files: FileItem[];
    breadcrumbs: BreadcrumbType[];
    currentFolderName: string;
    rootId: number;
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileIcon className="w-5 h-5 text-gray-500" />;
    if (mimeType.includes("image")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes("audio")) return <Music className="w-5 h-5 text-yellow-500" />;
    if (mimeType.includes("video")) return <Video className="w-5 h-5 text-rose-500" />;
    if (mimeType.includes("text") || mimeType.includes("javascript") || mimeType.includes("json")) return <Code className="w-5 h-5 text-green-500" />;
    return <FileIcon className="w-5 h-5 text-blue-500" />;
};

export default function PublicFolderBrowser({
    token,
    folders,
    files,
    breadcrumbs,
    currentFolderName,
    rootId
}: PublicFolderBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<"name" | "date" | "size">("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const filteredItems = useMemo(() => {
        let fFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
        let fFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const sorter = (a: any, b: any) => {
            let valA, valB;
            switch (sortOption) {
                case "name":
                    valA = a.name.toLowerCase();
                    valB = b.name.toLowerCase();
                    break;
                case "size":
                    // Folders always 0 for sorting mixed or keep separate? 
                    // Let's sort folders and files separately
                    valA = (a as any).size || 0;
                    valB = (b as any).size || 0;
                    break;
                case "date":
                    valA = new Date(a.updatedAt || 0).getTime();
                    valB = new Date(b.updatedAt || 0).getTime();
                    break;
                default:
                    return 0;
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        };

        fFolders.sort(sorter);
        fFiles.sort(sorter);

        return { folders: fFolders, files: fFiles };
    }, [folders, files, searchQuery, sortOption, sortDirection]);

    const toggleSort = (option: "name" | "date" | "size") => {
        if (sortOption === option) {
            setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortOption(option);
            setSortDirection("asc");
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header & Toolbar */}
            <div className="p-4 border-b bg-white space-y-4">

                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-500 overflow-x-auto pb-2 sm:pb-0">
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => {
                                const isRoot = crumb.id === rootId;
                                // Link destination: if it's the root item use base url, else folder param
                                const href = isRoot
                                    ? `/s/share/${token}`
                                    : `/s/share/${token}?folderId=${crumb.id}`;

                                const isLast = index === breadcrumbs.length - 1;

                                return (
                                    <BreadcrumbItem key={crumb.id}>
                                        {!isLast ? (
                                            <>
                                                <BreadcrumbLink asChild>
                                                    <Link href={href} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                                        {index === 0 && <Home className="w-3.5 h-3.5" />}
                                                        {crumb.name}
                                                    </Link>
                                                </BreadcrumbLink>
                                                <BreadcrumbSeparator />
                                            </>
                                        ) : (
                                            <BreadcrumbPage className="font-medium text-gray-900 flex items-center gap-1">
                                                {index === 0 && <Home className="w-3.5 h-3.5" />}
                                                {crumb.name}
                                            </BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {/* Search & Sort */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar archivos..."
                            className="pl-9 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ordenar por:</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                    {sortOption === "name" && "Nombre"}
                                    {sortOption === "size" && "Tamaño"}
                                    {sortOption === "date" && "Fecha"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleSort("name")}>Nombre</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSort("date")}>Fecha</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSort("size")}>Tamaño</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="divide-y divide-gray-100 min-h-[300px]">
                {filteredItems.folders.length === 0 && filteredItems.files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p>No se encontraron resultados</p>
                        {searchQuery && <p className="text-sm mt-1">Intenta con otra búsqueda</p>}
                    </div>
                ) : (
                    <>
                        {filteredItems.folders.map(folder => (
                            <Link
                                key={folder.id}
                                href={`/s/share/${token}?folderId=${folder.id}`}
                                className="flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="bg-yellow-100/50 p-2.5 rounded-lg">
                                        <FolderIcon className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 group-hover:text-blue-700 truncate">{folder.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5" suppressHydrationWarning>
                                            {folder.updatedAt ? new Date(folder.updatedAt).toLocaleDateString() : '-'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                            </Link>
                        ))}

                        {filteredItems.files.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="relative group/icon">
                                        {file.mimeType?.startsWith('image/') ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                                <img
                                                    src={`/api/public/download/${token}?fileId=${file.id}`}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 p-2.5 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all h-10 w-10 flex items-center justify-center">
                                                {getFileIcon(file.mimeType)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <span>{formatBytes(file.size)}</span>
                                            <span>•</span>
                                            <span suppressHydrationWarning>{file.updatedAt ? new Date(file.updatedAt).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                <a
                                    href={`/api/public/download/${token}?fileId=${file.id}`}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Descargar"
                                    download
                                >
                                    <Download className="w-5 h-5" />
                                </a>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="bg-gray-50 border-t p-3 text-center text-xs text-gray-400">
                Mostrando {filteredItems.folders.length} carpetas y {filteredItems.files.length} archivos
            </div>
        </div>
    );
}
