'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Folder, File as FileIcon, Home, Loader2, ArrowLeft, Cloud } from 'lucide-react';
import { getCloudData } from '@/actions/files';
import { attachFileToModel } from '@/actions/files';

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
    areaId?: number;
    // Callbacks
    onFileSelected?: (file: FileModel) => void;
    onFileLinked?: (file?: FileModel) => void;
}

export default function FileSelectorModal({
    isOpen,
    onClose,
    modelType,
    modelId,
    areaId,
    onFileSelected,
    onFileLinked
}: FileSelectorModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [allFolders, setAllFolders] = useState<FolderModel[]>([]);
    const [allFiles, setAllFiles] = useState<FileModel[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

    // Initial load
    useEffect(() => {
        if (isOpen && allFolders.length === 0 && allFiles.length === 0) {
            loadData();
        }
        if (!isOpen) {
            // Reset state when closed? Vue implementation keeps cache.
            // We can keep it or reset selection
            setSelectedFileId(null);
            setCurrentFolderId(null);
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await getCloudData();
            setAllFolders(data.folders);
            setAllFiles(data.files);
        } catch (error) {
            console.error("Error loading cloud data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentFolders = useMemo(() => {
        return allFolders.filter(f => f.parent_id === currentFolderId || (!currentFolderId && !f.parent_id));
    }, [allFolders, currentFolderId]);

    const currentFiles = useMemo(() => {
        return allFiles.filter(f => f.folder_id === currentFolderId || (!currentFolderId && !f.folder_id));
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
            setIsLoading(true);
            const result = await attachFileToModel(file.id, modelType, modelId, areaId);
            setIsLoading(false);
            if (result.success) {
                // Pass the file info to the callback
                if (onFileLinked) onFileLinked(file);
                onClose();
            } else {
                alert("Error al vincular archivo.");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Seleccionar Archivo de Cloud</DialogTitle>
                </DialogHeader>

                <div className="h-96 flex flex-col">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                        <button onClick={() => setCurrentFolderId(null)} className="hover:text-blue-600 hover:underline flex items-center">
                            <Home className="w-4 h-4 mr-1" /> Inicio
                        </button>
                        {breadcrumbs.map(crumb => (
                            <React.Fragment key={crumb.id}>
                                <span className="mx-2">/</span>
                                <button onClick={() => setCurrentFolderId(crumb.id)} className="hover:text-blue-600 hover:underline">
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto border rounded-md p-2 relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        )}

                        {/* Folders */}
                        {currentFolders.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Carpetas</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {currentFolders.map(folder => (
                                        <div key={folder.id}
                                            onClick={() => setCurrentFolderId(folder.id)}
                                            className="cursor-pointer p-3 bg-yellow-50 rounded border border-yellow-100 hover:bg-yellow-100 flex items-center transition"
                                        >
                                            <Folder className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                                            <span className="truncate text-sm text-gray-700">{folder.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Files */}
                        {currentFiles.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Archivos</h4>
                                <div className="space-y-1">
                                    {currentFiles.map(file => (
                                        <div key={file.id}
                                            onClick={() => setSelectedFileId(selectedFileId === file.id ? null : file.id)}
                                            className={`cursor-pointer p-2 rounded border flex items-center justify-between transition ${selectedFileId === file.id
                                                ? 'bg-blue-100 border-blue-500 ring-1 ring-blue-500'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center overflow-hidden">
                                                <FileIcon className={`w-4 h-4 mr-3 flex-shrink-0 ${selectedFileId === file.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                                <span className={`truncate text-sm ${selectedFileId === file.id ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                                    {file.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{file.readable_size}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentFolders.length === 0 && currentFiles.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Cloud className="w-12 h-12 mb-2 text-gray-300" />
                                <p className="text-sm">Carpeta vacía</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedFileId || isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Seleccionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Minimal UI Components (if not modifying existing generic ones, assume shadcn or similar available, 
// if not I should create simple ones, but let's assume usage of `@/components/ui/...` implies they exist project-wide or I should create them.
// Given strict instructions to NOT create non-requested infrastructure unless verified, usually I check, 
// but asking user might be annoying.
// I will check `components.json` which exists, so shadcn components likely exist or can be generated.
// However `components/ui/dialog` might not exist. I should check `components/ui` dir.
