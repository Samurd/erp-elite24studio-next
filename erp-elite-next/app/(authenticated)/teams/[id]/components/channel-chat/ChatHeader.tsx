'use client';

import { MoreVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
    channel: any;
    isTyping: boolean;
    typingUser: string;
    isConnected: boolean;
    onOpenSettings: () => void;
}

export default function ChatHeader({
    channel,
    isTyping,
    typingUser,
    isConnected,
    onOpenSettings
}: ChatHeaderProps) {
    return (
        <div className="px-6 py-4 border-b border-gray-200 shadow-sm flex items-center justify-between z-10 bg-white">
            <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <span className="text-gray-400 mr-2 text-2xl">#</span> {channel.name}
                </h2>
                <div className="flex items-center gap-2 h-4">
                    {isTyping ? (
                        <span className="text-xs text-green-600 animate-pulse font-medium">{typingUser} está escribiendo...</span>
                    ) : (
                        <p className="text-sm text-gray-500">{channel.description || 'Sin descripción'}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Conectado' : 'Desconectado'}></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onOpenSettings}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configuración del Canal
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
