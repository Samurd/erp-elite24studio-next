'use client'

import { useRef, useState } from 'react';
import { Link as LinkIcon, CloudUpload, X } from 'lucide-react';
import FileSelectorModal from './FileSelectorModal';

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
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Adjuntar Archivos</h3>
                <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                    onClick={() => setIsSelectorOpen(true)}
                >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Seleccionar del Cloud
                </button>
            </div>

            <FileSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onFileSelected={(file) => {
                    // Check if already in pending
                    if (!pendingCloudFiles.find(f => f.id === file.id)) {
                        onPendingCloudFilesChange([...pendingCloudFiles, file]);
                    }
                }}
            />

            {/* Drop Zone */}
            <div
                className={`relative mb-6 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDropping ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
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

                <div>
                    <p className="text-gray-500 text-sm flex flex-col items-center">
                        <CloudUpload className="w-8 h-8 mb-2 text-blue-400" />
                        Haz clic o arrastra para agregar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Se vincularán al crear el registro</p>
                </div>
            </div>

            {/* Lists */}
            <div className="space-y-3">
                {/* New Uploads */}
                {files.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Nuevos Archivos:</p>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div key={`new-${index}`} className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-100">
                                    <div className="flex items-center overflow-hidden">
                                        <div className="text-blue-400 mr-2">
                                            {/* Icon placeholder if needed */}
                                        </div >
                                        <span className="text-sm text-blue-900 truncate" title={file.name}>
                                            {file.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-blue-600">{formatSize(file.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cloud Links */}
                {pendingCloudFiles.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2 mt-4">Vincular desde Cloud:</p>
                        <div className="space-y-2">
                            {pendingCloudFiles.map((file, index) => (
                                <div key={file.id} className="flex items-center justify-between bg-purple-50 p-2 rounded border border-purple-100">
                                    <div className="flex items-center overflow-hidden">
                                        <LinkIcon className="w-4 h-4 text-purple-400 mr-2" />
                                        <span className="text-sm text-purple-900 truncate" title={file.name}>
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCloudFile(index)}
                                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {files.length === 0 && pendingCloudFiles.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-4 italic border-t border-gray-100">
                        No hay archivos seleccionados.
                    </div>
                )}
            </div>
        </div>
    );
}
