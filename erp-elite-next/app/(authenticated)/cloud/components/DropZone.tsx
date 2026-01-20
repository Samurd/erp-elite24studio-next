'use client';

import { CloudUpload } from 'lucide-react';

interface DropZoneProps {
    dropping: boolean;
}

export default function DropZone({ dropping }: DropZoneProps) {
    if (!dropping) return null;

    return (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-2xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
                <CloudUpload className="w-16 h-16 text-blue-600 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-blue-600">Suelta los archivos aquí</h3>
            </div>
        </div>
    );
}
