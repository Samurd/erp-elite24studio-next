'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder } from 'lucide-react';
import ShareModal from './components/ShareModal';
import { CloudData, CloudItem } from './components/types';
import CloudHeader from './components/CloudHeader';
import DropZone from './components/DropZone';
import CloudGrid from './components/CloudGrid';
import CloudList from './components/CloudList';
import CloudContextMenu from './components/CloudContextMenu';

export default function CloudPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const folderId = searchParams.get('folder');

    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('cloud-view-mode') as 'grid' | 'list') || 'grid';
        }
        return 'grid';
    });
    const [dropping, setDropping] = useState(false);
    const [renamingItem, setRenamingItem] = useState<CloudItem | null>(null);
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; item: any; type: 'file' | 'folder' } | null>(null);
    const [sharingItem, setSharingItem] = useState<CloudItem | null>(null);

    // Fetch cloud data
    const { data, isLoading } = useQuery<CloudData>({
        queryKey: ['cloud', folderId],
        queryFn: async () => {
            const url = folderId ? `/api/cloud?folder=${folderId}` : '/api/cloud';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        }
    });

    // Create folder mutation
    const createFolderMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch('/api/cloud/folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    parent_id: folderId ? parseInt(folderId) : null
                })
            });
            if (!res.ok) throw new Error('Failed to create folder');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud', folderId] });
        }
    });

    // Upload file mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            if (folderId) {
                formData.append('folder_id', folderId);
            }

            const res = await fetch('/api/cloud/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Failed to upload');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud', folderId] });
        }
    });

    // Rename mutation
    const renameMutation = useMutation({
        mutationFn: async ({ id, name, type }: { id: number; name: string; type: 'file' | 'folder' }) => {
            const res = await fetch(`/api/cloud/rename/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type })
            });
            if (!res.ok) throw new Error('Failed to rename');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud', folderId] });
            setRenamingItem(null);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async ({ id, type }: { id: number; type: 'file' | 'folder' }) => {
            const res = await fetch(`/api/cloud/delete/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cloud', folderId] });
        }
    });

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('cloud-view-mode', mode);
    };

    const openFolder = (id: number | null) => {
        if (id) {
            router.push(`/cloud?folder=${id}`);
        } else {
            // If we're in a shared folder and user clicks to go to "root", 
            // go to the shared folder root (first breadcrumb), not the cloud root
            const isInSharedFolder = data?.currentFolder?.ownerName === 'Shared';
            if (isInSharedFolder && data?.breadcrumbs && data.breadcrumbs.length > 0) {
                // Go to the first breadcrumb which is the shared folder root
                router.push(`/cloud?folder=${data.breadcrumbs[0].id}`);
            } else {
                router.push('/cloud');
            }
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
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            item,
            type
        });
    };

    const handleDelete = (item: any, type: 'file' | 'folder') => {
        if (confirm('¿Estás seguro de eliminar este elemento?')) {
            deleteMutation.mutate({ id: item.id, type });
        }
        setContextMenu(null);
    };

    const downloadFile = (file: any) => {
        const link = document.createElement('a');
        link.href = `/api/files/download/${file.id}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // Only close on left click, not right click
            if (e.button === 0) {
                setContextMenu(null);
            }
        };
        const handleContextMenuGlobal = () => {
            // Close existing context menu when opening a new one
            setContextMenu(null);
        };
        document.addEventListener('click', handleClick);
        document.addEventListener('contextmenu', handleContextMenuGlobal);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('contextmenu', handleContextMenuGlobal);
        };
    }, []);

    const handleRenameSubmit = () => {
        if (!renamingItem) return;

        let newName = renamingItem.name;

        // Preserve extension for files
        if (renamingItem.type === 'file') {
            const originalFile = (data?.files || []).find(f => f.id === renamingItem.id);
            if (originalFile) {
                const originalExtension = originalFile.name.split('.').pop();
                if (originalExtension && !newName.endsWith(`.${originalExtension}`)) {
                    newName = `${newName}.${originalExtension}`;
                }
            }
        }

        renameMutation.mutate({ ...renamingItem, name: newName });
        setRenamingItem(null);
    };

    return (
        <div
            className="text-gray-900"
            onDragOver={(e) => { e.preventDefault(); setDropping(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDropping(false); }}
            onDrop={handleDrop}
        >
            <DropZone dropping={dropping} />

            <div className="max-w-7xl mx-auto">
                <CloudHeader
                    data={data}
                    folderId={folderId}
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                    onOpenFolder={openFolder}
                    onCreateFolder={(name) => createFolderMutation.mutate(name)}
                    onFileUpload={handleFileUpload}
                    isShareView={data?.currentFolder?.ownerName === 'Shared'}
                />

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Empty State checks both personal and shared */}
                        {data?.folders.length === 0 && data?.files.length === 0 && (!data?.sharedFolders || data.sharedFolders.length === 0) && (!data?.sharedFiles || data.sharedFiles.length === 0) ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Folder className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-700">Carpeta vacía</h3>
                                <p className="text-sm mt-1">Sube archivos o crea una carpeta</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Shared Section (Only show if there are shared items) */}
                                {((data?.sharedFolders && data?.sharedFolders.length > 0) || (data?.sharedFiles && data?.sharedFiles.length > 0)) && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">Compartido conmigo</h2>
                                        {viewMode === 'grid' && (
                                            <CloudGrid
                                                folders={data?.sharedFolders || []}
                                                files={data?.sharedFiles || []}
                                                renamingItem={renamingItem}
                                                onRenameChange={(name) => renamingItem && setRenamingItem({ ...renamingItem, name })}
                                                onRenameSubmit={handleRenameSubmit}
                                                onRenameCancel={() => setRenamingItem(null)}
                                                onOpenFolder={openFolder}
                                                onDownloadFile={downloadFile}
                                                onContextMenu={handleContextMenu}
                                            />
                                        )}
                                        {viewMode === 'list' && (
                                            <CloudList
                                                folders={data?.sharedFolders || []}
                                                files={data?.sharedFiles || []}
                                                renamingItem={renamingItem}
                                                onRenameChange={(name) => renamingItem && setRenamingItem({ ...renamingItem, name })}
                                                onRenameSubmit={handleRenameSubmit}
                                                onRenameCancel={() => setRenamingItem(null)}
                                                onOpenFolder={openFolder}
                                                onDownloadFile={downloadFile}
                                                onContextMenu={handleContextMenu}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Personal Section */}
                                {((data?.folders?.length ?? 0) > 0 || (data?.files?.length ?? 0) > 0) && (
                                    <div>
                                        {/* Only show "My Files" header if shared section is also visible, to distinguish */}
                                        {((data?.sharedFolders && data?.sharedFolders.length > 0) || (data?.sharedFiles && data?.sharedFiles.length > 0)) && (
                                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">Mis Archivos</h2>
                                        )}
                                        {viewMode === 'grid' && (
                                            <CloudGrid
                                                folders={data?.folders || []}
                                                files={data?.files || []}
                                                renamingItem={renamingItem}
                                                onRenameChange={(name) => renamingItem && setRenamingItem({ ...renamingItem, name })}
                                                onRenameSubmit={handleRenameSubmit}
                                                onRenameCancel={() => setRenamingItem(null)}
                                                onOpenFolder={openFolder}
                                                onDownloadFile={downloadFile}
                                                onContextMenu={handleContextMenu}
                                            />
                                        )}

                                        {viewMode === 'list' && (
                                            <CloudList
                                                folders={data?.folders || []}
                                                files={data?.files || []}
                                                renamingItem={renamingItem}
                                                onRenameChange={(name) => renamingItem && setRenamingItem({ ...renamingItem, name })}
                                                onRenameSubmit={handleRenameSubmit}
                                                onRenameCancel={() => setRenamingItem(null)}
                                                onOpenFolder={openFolder}
                                                onDownloadFile={downloadFile}
                                                onContextMenu={handleContextMenu}
                                            />
                                        )}
                                    </div>
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
                        onRename={(item) => setRenamingItem(item)}
                        onDelete={handleDelete}
                        onShare={(item) => setSharingItem(item)}
                        onDownload={downloadFile}
                    />
                )}

                <ShareModal
                    isOpen={!!sharingItem}
                    item={sharingItem}
                    onClose={() => setSharingItem(null)}
                />
            </div>
        </div>
    );
}
