'use client';

import { Folder, File, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateService } from '@/lib/date-service';
import { CloudData, CloudItem } from './types';

interface CloudGridProps {
    data: CloudData | undefined;
    renamingItem: CloudItem | null;
    onRenameChange: (name: string) => void;
    onRenameSubmit: () => void;
    onRenameCancel: () => void;
    onOpenFolder: (id: number) => void;
    onDownloadFile: (file: any) => void;
    onContextMenu: (e: React.MouseEvent, item: any, type: 'file' | 'folder') => void;
}

export default function CloudGrid({
    data,
    renamingItem,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
    onOpenFolder,
    onDownloadFile,
    onContextMenu
}: CloudGridProps) {
    const isImage = (mimeType: string | null) => mimeType?.startsWith('image/');

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return 'Fecha no disponible';
        return DateService.toDisplay(date);
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Folders */}
            {data?.folders.map((folder) => (
                <div
                    key={`folder-${folder.id}`}
                    onClick={() => onOpenFolder(folder.id)}
                    onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
                    className="group relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center text-center shadow-sm"
                >
                    <Folder className="w-16 h-16 mb-3 text-yellow-500 transition-transform group-hover:scale-110" />

                    {renamingItem?.id === folder.id && renamingItem?.type === 'folder' ? (
                        <Input
                            type="text"
                            value={renamingItem.name}
                            onChange={(e) => onRenameChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRenameSubmit();
                                }
                                if (e.key === 'Escape') onRenameCancel();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white border-blue-500 text-xs text-center text-gray-900"
                            autoFocus
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-700 truncate w-full px-2" title={folder.name}>
                            {folder.name}
                        </span>
                    )}

                    <span className="text-[10px] text-gray-500 mt-1">
                        {formatDate(folder.created_at)}
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            onContextMenu(e as any, folder, 'folder');
                        }}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            ))}

            {/* Files */}
            {data?.files.map((file) => (
                <div
                    key={`file-${file.id}`}
                    onClick={() => onDownloadFile(file)}
                    onContextMenu={(e) => onContextMenu(e, file, 'file')}
                    className="group relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center text-center shadow-sm"
                >
                    <div className="w-16 h-16 mb-3 flex items-center justify-center transition-transform group-hover:scale-110">
                        {isImage(file.mimeType) ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover rounded-lg shadow-md" loading="lazy" />
                        ) : (
                            <File className="w-12 h-12 text-blue-400" />
                        )}
                    </div>

                    {renamingItem?.id === file.id && renamingItem?.type === 'file' ? (
                        <Input
                            type="text"
                            value={renamingItem.name}
                            onChange={(e) => onRenameChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRenameSubmit();
                                }
                                if (e.key === 'Escape') onRenameCancel();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white border-blue-500 text-xs text-center text-gray-900"
                            autoFocus
                        />
                    ) : (
                        <span className="text-sm font-medium text-gray-700 truncate w-full px-2 hover:text-blue-600 transition-colors" title={file.name}>
                            {file.name}
                        </span>
                    )}

                    <span className="text-[10px] text-gray-500 mt-1">{file.readable_size}</span>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            onContextMenu(e as any, file, 'file');
                        }}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
