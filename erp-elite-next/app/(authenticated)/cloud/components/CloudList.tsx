'use client';

import { Folder, File, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateService } from '@/lib/date-service';
import { CloudData, CloudItem } from './types';

interface CloudListProps {
    data: CloudData | undefined;
    renamingItem: CloudItem | null;
    onRenameChange: (name: string) => void;
    onRenameSubmit: () => void;
    onRenameCancel: () => void;
    onOpenFolder: (id: number) => void;
    onDownloadFile: (file: any) => void;
    onContextMenu: (e: React.MouseEvent, item: any, type: 'file' | 'folder') => void;
}

export default function CloudList({
    data,
    renamingItem,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
    onOpenFolder,
    onDownloadFile,
    onContextMenu
}: CloudListProps) {
    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return 'Fecha no disponible';
        return DateService.toDisplay(date);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
                    <tr>
                        <th className="px-4 py-3 w-8"></th>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Tamaño</th>
                        <th className="px-4 py-3">Modificado</th>
                        <th className="px-4 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {/* Folders */}
                    {data?.folders.map((folder) => (
                        <tr
                            key={`l-folder-${folder.id}`}
                            onClick={() => onOpenFolder(folder.id)}
                            onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
                            className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <td className="px-4 py-3 text-yellow-500">
                                <Folder className="w-4 h-4" />
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
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
                                        className="bg-white border-blue-500 text-xs text-gray-900"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{folder.name}</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">-</td>
                            <td className="px-4 py-3 text-gray-500">
                                {formatDate(folder.updated_at)}
                            </td>
                            <td className="px-4 py-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        onContextMenu(e as any, folder, 'folder');
                                    }}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}

                    {/* Files */}
                    {data?.files.map((file) => (
                        <tr
                            key={`l-file-${file.id}`}
                            onClick={() => onDownloadFile(file)}
                            onContextMenu={(e) => onContextMenu(e, file, 'file')}
                            className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <td className="px-4 py-3 text-blue-600">
                                <File className="w-4 h-4" />
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
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
                                        className="bg-white border-blue-500 text-xs text-gray-900"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="hover:underline">{file.name}</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{file.readable_size}</td>
                            <td className="px-4 py-3 text-gray-500">
                                {formatDate(file.updated_at)}
                            </td>
                            <td className="px-4 py-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.nativeEvent.stopImmediatePropagation();
                                        onContextMenu(e as any, file, 'file');
                                    }}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
