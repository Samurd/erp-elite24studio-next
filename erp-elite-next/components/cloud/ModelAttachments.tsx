'use client'

import { useState, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadFile, detachFileFromModel, attachFileToModel } from '@/actions/files';
import { FileIcon, Trash2, Link as LinkIcon, Download, X, CloudUpload } from 'lucide-react';
import FileSelectorModal from './FileSelectorModal';

interface FileModel {
    id: number;
    name: string;
    size: number | null;
    url: string;
    mimeType?: string | null;
}

interface ModelAttachmentsProps {
    initialFiles: FileModel[];
    modelId: number;
    modelType: string;
    onUpdate?: () => void;
    readOnly?: boolean;
}

const DEFAULT_FILES: FileModel[] = [];

export default function ModelAttachments({ initialFiles = DEFAULT_FILES, modelId, modelType, onUpdate, readOnly = false }: ModelAttachmentsProps) {
    const [files, setFiles] = useState<FileModel[]>(initialFiles);
    const [isDropping, setIsDropping] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isUploading, startUpload] = useTransition();
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Sync with props if they change (e.g. revalidation)
    // Use a more reliable comparison based on file IDs
    // Sync with props if they change (e.g. revalidation)
    // Use a more reliable comparison based on file IDs
    useEffect(() => {
        const currentIds = files.map(f => f.id).sort().join(',');
        const newIds = initialFiles.map(f => f.id).sort().join(',');

        if (currentIds !== newIds) {
            setFiles(initialFiles);
        }
    }, [initialFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(Array.from(e.target.files));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropping(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleUpload = (filesToUpload: File[]) => {
        startUpload(async () => {
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('file', file);

                // 1. Upload
                const result = await uploadFile(formData);
                if (result.success && result.file) {
                    // 2. Attach
                    const attachResult = await attachFileToModel(result.file.id, modelType, modelId);
                    if (attachResult.success) {
                        // Optimistic update: add to UI immediately
                        setFiles(prev => [...prev, {
                            id: result.file.id,
                            name: result.file.name,
                            size: result.file.size,
                            url: result.file.url,
                            mimeType: result.file.mimeType
                        }]);
                    } else {
                        console.error('Failed to attach', attachResult.error);
                        alert("Error al vincular archivo.");
                    }
                } else {
                    console.error('Failed to upload');
                    alert("Error al subir archivo.");
                }
            }
            router.refresh(); // Fetch new data from server to sync
            onUpdate?.();
        });
    };

    const handleDetach = async (fileId: number) => {
        if (!confirm('¿Desvincular archivo?')) return;

        // Optimistic update: remove from UI immediately
        setFiles(prev => prev.filter(f => f.id !== fileId));

        await detachFileFromModel(fileId, modelType, modelId);
        router.refresh();
        onUpdate?.();
    };

    const formatSize = (bytes: number | null | undefined) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Archivos Adjuntos</h3>
                {!readOnly && (
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                        onClick={() => setIsSelectorOpen(true)}
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Seleccionar del Cloud
                    </button>
                )}
            </div>

            <FileSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                modelType={modelType}
                modelId={modelId}
                onFileLinked={(file) => {
                    // Optimistic update: add the linked file to UI immediately
                    if (file) {
                        setFiles(prev => [...prev, {
                            id: file.id,
                            name: file.name,
                            size: file.size,
                            url: file.url,
                            mimeType: null
                        }]);
                    }
                    router.refresh();
                    onUpdate?.();
                }}
            />

            {/* Drop Zone */}
            {!readOnly && (
                <div
                    className={`relative mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDropping ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDropping(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDropping(false); }}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={inputRef}
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {isUploading ? (
                        <div className="text-blue-600 text-sm font-semibold">Subiendo...</div>
                    ) : (
                        <div>
                            <p className="text-gray-500 text-sm flex flex-col items-center">
                                <CloudUpload className="w-8 h-8 mb-2 text-blue-400" />
                                Haz clic o arrastra para agregar
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* File List */}
            <div className="space-y-2">
                {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:shadow-sm transition group">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="text-gray-400 group-hover:text-blue-500 transition">
                                <FileIcon className="w-6 h-6" />
                            </div>
                            <div className="truncate">
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-700 hover:text-blue-600 truncate block">
                                    {file.name}
                                </a>
                                <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1">
                            <a href={file.url} download className="text-gray-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition" title="Descargar">
                                <Download className="w-4 h-4" />
                            </a>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => handleDetach(file.id)}
                                    className="text-gray-400 hover:text-orange-500 p-2 rounded hover:bg-orange-50 transition"
                                    title="Desvincular"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {files.length === 0 && (
                    <div className="text-center text-gray-400 py-4 text-sm border border-dashed border-gray-200 rounded">
                        No hay archivos adjuntos.
                    </div>
                )}
            </div>
        </div>
    );
}
