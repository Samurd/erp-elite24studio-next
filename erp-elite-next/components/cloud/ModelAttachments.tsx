'use client'

import { useState, useRef, useTransition, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile, detachFileFromModel, attachFileToModel, deleteFile } from '@/actions/files';
import { File as FileIcon, Trash2, Link as LinkIcon, Download, X, CloudUpload, Loader2, Paperclip } from 'lucide-react';
import { usePermission } from '@/hooks/usePermissions';
import FileSelectorModal from './FileSelectorModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileModel {
    id: number;
    name: string;
    size: number | null;
    url: string;
    mimeType?: string | null;
}

interface ModelAttachmentsProps {
    initialFiles?: FileModel[];
    modelId?: number; // If present, implies Edit Mode (immediate upload)
    modelType: string;
    areaSlug?: string;
    onUpdate?: () => void;
    readOnly?: boolean;
    onSelectionChange?: (count: number) => void;
    compact?: boolean;
}

export interface ModelAttachmentsRef {
    upload: () => Promise<number[]>;
    uploadWithDetails: () => Promise<FileModel[]>;
    clear: () => void;
}

const DEFAULT_FILES: FileModel[] = [];

const ModelAttachments = forwardRef<ModelAttachmentsRef, ModelAttachmentsProps>(({
    initialFiles = DEFAULT_FILES,
    modelId,
    modelType,
    areaSlug,
    onUpdate,
    readOnly = false,
    onSelectionChange,
    compact = false
}, ref) => {
    // State for existing files (Edit Mode & Post-Upload Create Mode)
    const [files, setFiles] = useState<FileModel[]>(initialFiles);

    // State for pending new uploads (Create Mode)
    const [pendingUploads, setPendingUploads] = useState<File[]>([]);

    // State for pending cloud links (Create Mode)
    const [pendingCloudLinks, setPendingCloudLinks] = useState<FileModel[]>([]);

    const [isDropping, setIsDropping] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isUploading, startUpload] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { hasPermission } = usePermission('cloud.delete');

    // Determine Mode
    const isEditMode = !!modelId;

    // Sync with props if they change
    useEffect(() => {
        const currentIds = files.map(f => f.id).sort().join(',');
        const newIds = initialFiles.map(f => f.id).sort().join(',');
        if (currentIds !== newIds) setFiles(initialFiles);
    }, [initialFiles]);

    // Notify parent of total count changes
    useEffect(() => {
        const count = files.length + pendingUploads.length + pendingCloudLinks.length;
        onSelectionChange?.(count);
    }, [files.length, pendingUploads.length, pendingCloudLinks.length, onSelectionChange]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        upload: async () => {
            const files = await uploadInternal();
            return files.map(f => f.id);
        },
        uploadWithDetails: async () => {
            return await uploadInternal();
        },
        clear: () => {
            setFiles([]);
            setPendingUploads([]);
            setPendingCloudLinks([]);
        }
    }));

    const uploadInternal = async (): Promise<FileModel[]> => {
        // If we are in Edit Mode, we assume files are already uploaded/linked immediately.
        if (isEditMode) {
            return files;
        }

        // In Create Mode, we must upload pending files and return all files (cloud links + new uploads)
        const uploadedFiles: FileModel[] = [];

        // 1. Add existing cloud links
        pendingCloudLinks.forEach(f => uploadedFiles.push(f));

        // 2. Upload new files
        if (pendingUploads.length > 0) {
            for (const file of pendingUploads) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('isModuleUpload', 'true');

                try {
                    const result = await uploadFile(formData);
                    if (result.success && result.file) {
                        uploadedFiles.push({
                            id: result.file.id,
                            name: result.file.name,
                            size: result.file.size,
                            url: result.file.url,
                            mimeType: result.file.mimeType
                        });
                    } else {
                        console.error('Failed to upload file during batch process');
                    }
                } catch (error) {
                    console.error("Error uploading file:", error);
                }
            }
        }

        return uploadedFiles;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleNewFiles(Array.from(e.target.files));
        }
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropping(false);
        if (!readOnly && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleNewFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleNewFiles = (newFiles: File[]) => {
        if (isEditMode) {
            // Immediate Upload
            handleImmediateUpload(newFiles);
        } else {
            // Add to pending queue
            setPendingUploads(prev => [...prev, ...newFiles]);
        }
    };

    const handleImmediateUpload = (filesToUpload: File[]) => {
        startUpload(async () => {
            let successCount = 0;
            let errorCount = 0;

            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('isModuleUpload', 'true');

                try {
                    const result = await uploadFile(formData);
                    if (result.success && result.file) {
                        // FIX: Pass areaSlug instead of areaId
                        const attachResult = await attachFileToModel(result.file.id, modelType, modelId!, undefined, areaSlug);
                        if (attachResult.success) {
                            successCount++;
                            setFiles(prev => [...prev, {
                                id: result.file!.id,
                                name: result.file!.name,
                                size: result.file!.size,
                                url: result.file!.url,
                                mimeType: result.file!.mimeType
                            }]);
                        } else {
                            errorCount++;
                        }
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }

            if (successCount > 0) toast.success("Archivos subidos", { description: `${successCount} archivo(s) subidos.` });
            if (errorCount > 0) toast.error("Error", { description: `Falló la subida de ${errorCount} archivo(s).` });

            router.refresh();
            onUpdate?.();
        });
    };

    const handleDetach = async (id: number, type: 'file' | 'pending' | 'cloud') => {
        if (type === 'file') {
            // Real detach (Edit Mode)
            if (!confirm('¿Desvincular archivo?')) return;
            setFiles(prev => prev.filter(f => f.id !== id));
            await detachFileFromModel(id, modelType, modelId!);
            router.refresh();
            onUpdate?.();
            toast.success("Archivo desvinculado", { description: "El archivo se ha eliminado de este registro." });
        } else if (type === 'pending') {
            // Already handled by removePendingUpload, but keeping logical branch
        } else if (type === 'cloud') {
            setPendingCloudLinks(prev => prev.filter(f => f.id !== id));
        }
    };

    const handleDelete = async (fileId: number) => {
        if (!confirm('¿Estás seguro de eliminar este archivo permanentemente? Esta acción no se puede rehacer.')) return;

        // Optimistic update
        setFiles(prev => prev.filter(f => f.id !== fileId));

        const result = await deleteFile(fileId);
        if (result.success) {
            toast.success("Archivo eliminado permanentemente");
            router.refresh();
            onUpdate?.();
        } else {
            toast.error("Error al eliminar", { description: result.error });
            router.refresh(); // Revert if failed
        }
    };

    const removePendingUpload = (index: number) => {
        setPendingUploads(prev => {
            const newArr = [...prev];
            newArr.splice(index, 1);
            return newArr;
        });
    }

    const formatSize = (bytes: number | null | undefined) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const totalCount = files.length + pendingUploads.length + pendingCloudLinks.length;

    return (
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${compact ? 'text-xs' : ''}`}>
            {/* Header */}
            {!compact && (
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        Archivos Adjuntos
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {totalCount}
                        </span>
                    </h3>
                    {!readOnly && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSelectorOpen(true)}
                            className="h-8 text-xs bg-white"
                            type="button"
                        >
                            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                            Seleccionar del Cloud
                        </Button>
                    )}
                </div>
            )}

            <div className={compact ? 'p-2' : 'p-4'}>
                <FileSelectorModal
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    modelType={isEditMode ? modelType : undefined} // Only pass linkage info in Edit Mode
                    modelId={isEditMode ? modelId : undefined}
                    areaSlug={areaSlug}
                    onFileLinked={(file) => {
                        // Edit Mode: It handles linking internally if we passed modelType/Id. 
                        // But FileSelectorModal might return the file for us to update UI.
                        if (isEditMode && file) {
                            setFiles(prev => [...prev, { id: file.id, name: file.name, size: file.size, url: file.url, mimeType: null }]);
                            toast.success("Archivo vinculado", { description: "Se ha vinculado el archivo desde el Cloud." });
                            router.refresh();
                            onUpdate?.();
                        }
                    }}
                    onFileSelected={(file) => {
                        // Create Mode: Just add to queue
                        if (!isEditMode && file) {
                            if (!pendingCloudLinks.find(f => f.id === file.id)) {
                                setPendingCloudLinks(prev => [...prev, { id: file.id, name: file.name, size: file.size, url: file.url }]);
                            }
                            setIsSelectorOpen(false); // Close manually since we are handling selection
                        }
                    }}
                />

                {/* Drop Zone */}
                {!readOnly && (
                    <div
                        className={`relative mb-2 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer group 
                            ${isDropping ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"} 
                            ${isUploading ? "opacity-70 pointer-events-none" : ""}
                            ${compact ? 'p-2 flex items-center justify-center gap-2' : 'p-6'}
                        `}
                        onDragOver={(e) => { e.preventDefault(); setIsDropping(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDropping(false); }}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input type="file" ref={inputRef} multiple className="hidden" onChange={handleFileChange} />

                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-2">
                                <Loader2 className={`text-blue-500 animate-spin ${compact ? 'w-4 h-4' : 'w-8 h-8 mb-2'}`} />
                                <span className="text-blue-600 font-medium">Subiendo...</span>
                            </div>
                        ) : compact ? (
                            <div className="flex items-center gap-2 text-gray-500 hover:text-blue-600">
                                <CloudUpload className="w-4 h-4" />
                                <span className="text-xs font-medium">Click o arrastrar archivos</span>
                            </div>
                        ) : (
                            <div className="py-2">
                                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <CloudUpload className="w-5 h-5" />
                                </div>
                                <p className="text-gray-900 text-sm font-medium">Haz clic o arrastra archivos aquí</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    {isEditMode ? "Se adjuntarán inmediatamente" : "Se adjuntarán al guardar"}
                                </p>
                            </div>
                        )}

                        {/* Cloud toggle for compact mode */}
                        {compact && !readOnly && !isUploading && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2" onClick={(e) => {
                                e.stopPropagation();
                                setIsSelectorOpen(true);
                            }}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-500" title="Seleccionar del Cloud">
                                    <LinkIcon className="w-3 h-3" />
                                    <span className="sr-only">Cloud</span>
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* File Lists */}
                <div className="space-y-1">
                    {/* 1. Pending Cloud Links (Create Mode) */}
                    {pendingCloudLinks.map(file => (
                        <div key={`link-${file.id}`} className={`group flex items-center justify-between bg-blue-50/30 rounded-lg border border-blue-100 shadow-sm ${compact ? 'p-1.5' : 'p-3'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`${compact ? 'w-6 h-6' : 'w-9 h-9'} flex items-center justify-center rounded-lg bg-blue-100 text-blue-500 border border-blue-200 flex-shrink-0`}>
                                    <LinkIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
                                </div>
                                <div className="min-w-0">
                                    <span className={`font-medium text-gray-700 truncate block ${compact ? 'text-xs' : 'text-sm'}`}>{file.name}</span>
                                    {!compact && <span className="text-xs text-blue-500 flex items-center gap-1">Desde Cloud • {formatSize(file.size)}</span>}
                                </div>
                            </div>
                            <button type="button" onClick={() => handleDetach(file.id, 'cloud')} className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50">
                                <X className={compact ? "w-3 h-3" : "w-4 h-4"} />
                            </button>
                        </div>
                    ))}

                    {/* 2. Pending Uploads (Create Mode) */}
                    {pendingUploads.map((file, idx) => (
                        <div key={`pending-${idx}`} className={`group flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 border-dashed shadow-sm ${compact ? 'p-1.5' : 'p-3'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`${compact ? 'w-6 h-6' : 'w-9 h-9'} flex items-center justify-center rounded-lg bg-gray-200 text-gray-500 border border-gray-300 flex-shrink-0`}>
                                    <CloudUpload className={compact ? "w-3 h-3" : "w-4 h-4"} />
                                </div>
                                <div className="min-w-0">
                                    <span className={`font-medium text-gray-700 truncate block ${compact ? 'text-xs' : 'text-sm'}`}>{file.name}</span>
                                    {!compact && <span className="text-xs text-orange-500 flex items-center gap-1">Pendiente de subir • {formatSize(file.size)}</span>}
                                </div>
                            </div>
                            <button type="button" onClick={() => removePendingUpload(idx)} className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50">
                                <X className={compact ? "w-3 h-3" : "w-4 h-4"} />
                            </button>
                        </div>
                    ))}

                    {/* 3. Existing Files (Edit Mode) */}
                    {files.map(file => (
                        <div key={file.id} className={`group flex items-center justify-between bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all ${compact ? 'p-1.5' : 'p-3'}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`${compact ? 'w-6 h-6' : 'w-9 h-9'} flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 border border-blue-100 flex-shrink-0`}>
                                    <FileIcon className={compact ? "w-3 h-3" : "w-5 h-5"} />
                                </div>
                                <div className="min-w-0">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className={`font-medium text-gray-700 hover:text-blue-600 truncate block hover:underline ${compact ? 'text-xs' : 'text-sm'}`}>
                                        {file.name}
                                    </a>
                                    {!compact && <span className="text-xs text-gray-400 flex items-center gap-1">{formatSize(file.size)}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {!compact && (
                                    <a href={file.url} download className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                        <Download className="w-4 h-4" />
                                    </a>
                                )}
                                {!readOnly && (
                                    <>
                                        {hasPermission && !compact && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar permanentemente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button type="button" onClick={() => handleDetach(file.id, 'file')} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Desvincular">
                                            <X className={compact ? "w-3 h-3" : "w-4 h-4"} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {totalCount === 0 && !isUploading && (
                        <div className={`text-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 ${compact ? 'py-2' : 'py-6'}`}>
                            <p className={compact ? 'text-xs' : 'text-sm'}>No hay archivos adjuntos</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

ModelAttachments.displayName = 'ModelAttachments';

export default ModelAttachments;
