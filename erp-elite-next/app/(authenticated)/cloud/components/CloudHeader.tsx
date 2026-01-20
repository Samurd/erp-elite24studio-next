'use client';

import {
    Home,
    FolderPlus,
    Upload,
    Grid3x3,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CloudData } from './types';
import { useState, useRef } from 'react';

interface CloudHeaderProps {
    data: CloudData | undefined;
    folderId: string | null;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onOpenFolder: (id: number | null) => void;
    onCreateFolder: (name: string) => void;
    onFileUpload: (files: FileList) => void;
}

export default function CloudHeader({
    data,
    folderId,
    viewMode,
    onViewModeChange,
    onOpenFolder,
    onCreateFolder,
    onFileUpload
}: CloudHeaderProps) {
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateFolderSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName) {
            onCreateFolder(newFolderName);
            setShowCreateFolder(false);
            setNewFolderName('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files);
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white py-4 border-b border-gray-200 mb-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 overflow-x-auto">
                <Button
                    variant={!folderId ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onOpenFolder(null)}
                    className="flex items-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    Root
                </Button>

                {data?.breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                        <span className="text-gray-600">/</span>
                        <Button
                            variant={index === data.breadcrumbs.length - 1 ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => onOpenFolder(crumb.id)}
                            className="max-w-[150px] truncate"
                        >
                            {crumb.name}
                        </Button>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => onViewModeChange('grid')}
                        className="h-8 w-8"
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => onViewModeChange('list')}
                        className="h-8 w-8"
                    >
                        <List className="w-4 h-4" />
                    </Button>
                </div>

                <div className="h-6 w-px bg-gray-300" />

                {data?.canCreate && (
                    <>
                        {/* Create Folder */}
                        <div className="relative">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCreateFolder(!showCreateFolder)}
                                className="flex items-center gap-2"
                            >
                                <FolderPlus className="w-4 h-4 text-yellow-500" />
                                Nueva Carpeta
                            </Button>

                            {showCreateFolder && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50">
                                    <form onSubmit={handleCreateFolderSubmit}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                placeholder="Ej. Proyectos"
                                                className="flex-1 bg-white border-gray-300 text-gray-900"
                                                autoFocus
                                            />
                                            <Button type="submit" size="sm">Crear</Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Upload */}
                        <Button
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500"
                        >
                            <Upload className="w-4 h-4" />
                            Subir Archivo
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
