'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, Share2, ArrowLeft, Eye, Edit, User, Cloud } from 'lucide-react';
import { CloudData, CloudItem } from '@/app/(authenticated)/cloud/components/types';
import CloudHeader from '@/app/(authenticated)/cloud/components/CloudHeader';
import DropZone from '@/app/(authenticated)/cloud/components/DropZone';
import CloudGrid from '@/app/(authenticated)/cloud/components/CloudGrid';
import CloudList from '@/app/(authenticated)/cloud/components/CloudList';
import CloudContextMenu from '@/app/(authenticated)/cloud/components/CloudContextMenu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function SharedCloudView({ token }: { token: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const folderId = searchParams.get('folder');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dropping, setDropping] = useState(false);
    const [renamingItem, setRenamingItem] = useState<CloudItem | null>(null);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; item: any; type: 'file' | 'folder' } | null>(null);

    // Fetch cloud data using Token API
    const { data, isLoading } = useQuery<CloudData>({
        queryKey: ['cloud-share', token, folderId],
        queryFn: async () => {
            const url = folderId
                ? `/api/cloud/share/${token}?folder=${folderId}`
                : `/api/cloud/share/${token}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        }
    });

    // Upload file mutation (If allowed)
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            if (folderId) formData.append('folder_id', folderId);

            const res = await fetch('/api/cloud/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Failed to upload');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud-share', token, folderId] });
        }
    });

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
    };

    const openFolder = (id: number | null) => {
        if (id) {
            router.push(`/cloud/share/${token}?folder=${id}`);
        } else {
            router.push(`/cloud/share/${token}`); // Go to root of share
        }
    };

    const handleFileUpload = (files: FileList) => {
        if (files && files.length > 0) {
            uploadMutation.mutate(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDropping(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadMutation.mutate(files[0]);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item: any, type: 'file' | 'folder') => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            item,
            type
        });
    };

    const downloadFile = (file: any) => {
        const link = document.createElement('a');
        link.href = `/api/files/download/${file.id}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRenameSubmit = () => { setRenamingItem(null); };
    const handleDelete = () => { setContextMenu(null); };

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const shareInfo = data?.shareInfo;

    return (
        <div
            className="text-gray-900 min-h-screen bg-gray-50"
            onDragOver={(e) => { e.preventDefault(); setDropping(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDropping(false); }}
            onDrop={handleDrop}
        >
            <DropZone dropping={dropping} />

            {/* Share Banner - Similar to Google Drive/OneDrive */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Share2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg">Contenido Compartido</span>
                                    {shareInfo?.isOwner && (
                                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                                            Eres el dueño
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-blue-100 text-sm mt-0.5">
                                    <span className="flex items-center gap-2">
                                        <Avatar className="h-5 w-5 border border-white/30">
                                            <AvatarImage src={shareInfo?.sharedByImage || undefined} />
                                            <AvatarFallback className="bg-white/20 text-white text-[10px]">
                                                {shareInfo?.sharedBy?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {shareInfo?.sharedBy || 'Cargando...'}
                                    </span>
                                    <span className="text-blue-300">•</span>
                                    <span className="flex items-center gap-1">
                                        {shareInfo?.permission === 'edit' ? (
                                            <>
                                                <Edit className="w-3.5 h-3.5" />
                                                Puede editar
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-3.5 h-3.5" />
                                                Solo lectura
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation to personal cloud */}
                        <Link href="/cloud">
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Cloud className="w-4 h-4 mr-2" />
                                Mi Cloud
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <CloudHeader
                    data={data}
                    folderId={folderId}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onOpenFolder={openFolder}
                    onCreateFolder={() => { }} // TODO: Implement create folder in shared view
                    onFileUpload={handleFileUpload}
                    isShareView={true}
                />

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {data?.folders.length === 0 && data?.files.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Folder className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-700">Carpeta vacía</h3>
                                <p className="text-sm text-gray-500 mt-1">No hay contenido en esta carpeta compartida</p>
                            </div>
                        ) : (
                            <div className="mt-6">
                                {viewMode === 'grid' ? (
                                    <CloudGrid
                                        folders={data?.folders || []}
                                        files={data?.files || []}
                                        renamingItem={renamingItem}
                                        onRenameChange={() => { }}
                                        onRenameSubmit={handleRenameSubmit}
                                        onRenameCancel={() => setRenamingItem(null)}
                                        onOpenFolder={openFolder}
                                        onDownloadFile={downloadFile}
                                        onContextMenu={handleContextMenu}
                                    />
                                ) : (
                                    <CloudList
                                        folders={data?.folders || []}
                                        files={data?.files || []}
                                        renamingItem={renamingItem}
                                        onRenameChange={() => { }}
                                        onRenameSubmit={handleRenameSubmit}
                                        onRenameCancel={() => setRenamingItem(null)}
                                        onOpenFolder={openFolder}
                                        onDownloadFile={downloadFile}
                                        onContextMenu={handleContextMenu}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}

                {contextMenu?.visible && (
                    <CloudContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        item={contextMenu.item}
                        type={contextMenu.type}
                        onClose={() => setContextMenu(null)}
                        onRename={() => { }}
                        onDelete={handleDelete}
                        onShare={() => { }}
                        onDownload={downloadFile}
                    />
                )}
            </div>
        </div>
    );
}
