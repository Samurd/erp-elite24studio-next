'use client';

import {
    Share2,
    Edit2,
    Trash2,
    Download
} from 'lucide-react';
import { CloudItem } from './types';

interface ContextMenuProps {
    x: number;
    y: number;
    item: any;
    type: 'file' | 'folder';
    onClose: () => void;
    onRename: (item: CloudItem) => void;
    onDelete: (item: any, type: 'file' | 'folder') => void;
    onShare: (item: CloudItem) => void;
    onDownload?: (item: any) => void;
}

export default function CloudContextMenu({
    x,
    y,
    item,
    type,
    onClose,
    onRename,
    onDelete,
    onShare,
    onDownload
}: ContextMenuProps) {
    return (
        <div
            style={{ top: y, left: x }}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] min-w-[160px] py-1"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={() => {
                    onShare({ id: item.id, type, name: item.name });
                    onClose();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
                <Share2 className="w-4 h-4 text-blue-600" /> Compartir
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
                onClick={() => {
                    onRename({ id: item.id, type, name: item.name });
                    onClose();
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
                <Edit2 className="w-4 h-4" /> Renombrar
            </button>
            <button
                onClick={() => {
                    onDelete(item, type);
                    onClose();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
            >
                <Trash2 className="w-4 h-4" /> Eliminar
            </button>
            {type === 'file' && onDownload && (
                <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                        onClick={() => {
                            onDownload(item);
                            onClose();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Descargar
                    </button>
                </>
            )}
        </div>
    );
}
