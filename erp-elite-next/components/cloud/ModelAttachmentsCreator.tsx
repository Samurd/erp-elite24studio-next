'use client'

import { useRef, useState } from 'react';
import { Link as LinkIcon, CloudUpload, X, File, Paperclip } from 'lucide-react';
import FileSelectorModal from './FileSelectorModal';
import { Button } from '@/components/ui/button';

export interface PendingFile {
    id: number;
    name: string;
    size: number | null;
    url: string;
}

interface ModelAttachmentsCreatorProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    pendingCloudFiles: PendingFile[];
    onPendingCloudFilesChange: (files: PendingFile[]) => void;
}

export default function ModelAttachmentsCreator({
    files,
    onFilesChange,
    pendingCloudFiles,
    onPendingCloudFilesChange
}: ModelAttachmentsCreatorProps) {
    const [isDropping, setIsDropping] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            onFilesChange([...files, ...newFiles]);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropping(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            onFilesChange([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
    };

    const removeCloudFile = (index: number) => {
        const newFiles = [...pendingCloudFiles];
        newFiles.splice(index, 1);
        onPendingCloudFilesChange(newFiles);
    };

    const formatSize = (bytes: number | null | undefined) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    Adjuntar Archivos
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {files.length + pendingCloudFiles.length}
                    </span>
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    className="h-8 text-xs bg-white"
                    onClick={() => setIsSelectorOpen(true)}
                >
                    <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
                    Seleccionar del Cloud
                </Button>
            </div>

            <div className="p-4">
                <FileSelectorModal
                    isOpen={isSelectorOpen}
                    onClose={() => setIsSelectorOpen(false)}
                    onFileSelected={(file) => {
                        // Check if already in pending
                        if (!pendingCloudFiles.find(f => f.id === file.id)) {
                            onPendingCloudFilesChange([...pendingCloudFiles, file]);
                        }
                        setIsSelectorOpen(false);
                    }}
                />

                {/* Drop Zone */}
                <div
                    className={`relative mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer group ${isDropping
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                        }`}
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

                    <div className="py-2">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <CloudUpload className="w-5 h-5" />
                        </div>
                        <p className="text-gray-900 text-sm font-medium">
                            Haz clic o arrastra archivos aquí
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                            Se vincularán al crear el registro
                        </p>
                    </div>
                </div>

                {/* Lists */}
                <div className="space-y-3">
                    {/* Cloud Links */}
                    {pendingCloudFiles.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Desde Cloud ({pendingCloudFiles.length})</p>
                            <div className="space-y-2">
                                {pendingCloudFiles.map((file, index) => (
                                    <div key={`cloud-${file.id}`} className="flex items-center justify-between p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <div className="flex items-center overflow-hidden gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-600 flex-shrink-0">
                                                <LinkIcon className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium text-blue-900 truncate block" title={file.name}>
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-blue-500">{formatSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCloudFile(index)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Uploads */}
                    {files.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1 mt-3">Nuevos Archivos ({files.length})</p>
                            <div className="space-y-2">
                                {files.map((file, index) => (
                                    <div key={`new-${index}`} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200">
                                        <div className="flex items-center overflow-hidden gap-3">
                                            <div className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-500 flex-shrink-0">
                                                <File className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium text-gray-700 truncate block" title={file.name}>
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {files.length === 0 && pendingCloudFiles.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-4 bg-gray-50/30 rounded-lg border border-dashed border-gray-100">
                            No hay archivos seleccionados.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
