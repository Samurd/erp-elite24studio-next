'use client'

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, File as FileIcon, Home, Loader2, Cloud, ChevronRight } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCloudData, attachFileToModel } from '@/actions/files';

interface FolderModel {
    id: number;
    name: string;
    parent_id?: number | null;
}

interface FileModel {
    id: number;
    name: string;
    folder_id?: number | null;
    size: number | null;
    readable_size: string;
    url: string;
}

interface FileSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Context
    modelType?: string;
    modelId?: number;
    areaSlug?: string;
    // Callbacks
    onFileSelected?: (file: FileModel) => void;
    onFileLinked?: (file?: FileModel) => void;
}

export default function FileSelectorModal({
    isOpen,
    onClose,
    modelType,
    modelId,
    areaSlug,
    onFileSelected,
    onFileLinked
}: FileSelectorModalProps) {
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

    // Fetch cloud data using TanStack Query
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['cloud-selector'],
        queryFn: async () => {
            return await getCloudData();
        },
        enabled: isOpen, // Only fetch when modal is open
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const allFolders = data?.folders || [];
    const allFiles = data?.files || [];

    // Reset state when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setSelectedFileId(null);
            setCurrentFolderId(null);
        }
    }, [isOpen]);

    const currentFolders = useMemo(() => {
        return allFolders.filter(f =>
            currentFolderId ? f.parent_id === currentFolderId : !f.parent_id
        );
    }, [allFolders, currentFolderId]);

    const currentFiles = useMemo(() => {
        return allFiles.filter(f =>
            currentFolderId ? f.folder_id === currentFolderId : !f.folder_id
        );
    }, [allFiles, currentFolderId]);

    const breadcrumbs = useMemo(() => {
        const crumbs: FolderModel[] = [];
        if (!currentFolderId) return crumbs;

        let curr = allFolders.find(f => f.id === currentFolderId);
        while (curr) {
            crumbs.unshift(curr);
            const parentId = curr.parent_id;
            if (parentId) {
                curr = allFolders.find(f => f.id === parentId);
            } else {
                curr = undefined;
            }
        }
        return crumbs;
    }, [allFolders, currentFolderId]);

    // Attach file mutation
    const attachMutation = useMutation({
        mutationFn: async (fileId: number) => {
            if (modelType && modelId) {
                return await attachFileToModel(fileId, modelType, modelId, undefined, areaSlug);
            }
            return { success: true };
        }
    });

    const handleConfirm = async () => {
        if (!selectedFileId) return;
        const file = allFiles.find(f => f.id === selectedFileId);
        if (!file) return;

        // Mode 1: Selection for creation (passes file back)
        if (!modelId && onFileSelected) {
            onFileSelected(file);
            onClose();
            return;
        }

        // Mode 2: Link to existing model
        if (modelType && modelId) {
            const result = await attachMutation.mutateAsync(file.id);
            if (result.success) {
                if (onFileLinked) onFileLinked(file);
                onClose();
            } else {
                alert("Error al vincular archivo.");
            }
        }
    };

    const isSubmitting = attachMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        Seleccionar Archivo de Cloud
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className={`hover:text-blue-600 flex items-center transition-colors ${!currentFolderId ? 'text-blue-600 font-medium' : ''}`}
                        >
                            <Home className="w-4 h-4 mr-1.5" />
                            Mi Cloud
                        </button>
                        {breadcrumbs.map(crumb => (
                            <React.Fragment key={crumb.id}>
                                <ChevronRight className="w-4 h-4 mx-1.5 text-gray-400" />
                                <button
                                    onClick={() => setCurrentFolderId(crumb.id)}
                                    className={`hover:text-blue-600 transition-colors truncate max-w-[120px] ${crumb.id === currentFolderId ? 'text-blue-600 font-medium' : ''}`}
                                >
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 relative min-h-[300px]">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/90 flex justify-center items-center z-10 rounded-lg">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <span className="text-sm text-gray-500">Cargando archivos...</span>
                                </div>
                            </div>
                        )}

                        {/* Folders */}
                        {currentFolders.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Carpetas</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {currentFolders.map(folder => (
                                        <div key={folder.id}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                            className="cursor-pointer p-3 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 hover:border-amber-200 flex items-center transition-all group"
                                        >
                                            <Folder className="w-5 h-5 text-amber-500 mr-2.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                            <span className="truncate text-sm text-gray-700 font-medium">{folder.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {currentFiles.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Archivos</h4>
                                <div className="space-y-1.5">
                                    {currentFiles.map(file => (
                                        <div key={file.id}
                                            onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                                            className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between transition-all ${selectedFileId === file.id
                                                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                                                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center overflow-hidden">
                                                <FileIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${selectedFileId === file.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className={`truncate text-sm ${selectedFileId === file.id ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                                    {file.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 ml-3 whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
                                                {file.readable_size}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentFolders.length === 0 && currentFiles.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Cloud className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">Carpeta vacía</p>
                                <p className="text-xs text-gray-400 mt-1">No hay archivos en esta ubicación</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4 gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedFileId || isSubmitting}
                        className="min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Vinculando...
                            </>
                        ) : (
                            'Seleccionar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
