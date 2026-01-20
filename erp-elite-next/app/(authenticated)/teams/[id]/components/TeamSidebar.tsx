import { Hash, Lock, Plus, Settings, Trash, Edit, ArrowRight, Info, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';

interface Channel {
    id: number;
    name: string;
    isPrivate: boolean;
    parentId?: number | null;
    children?: Channel[];
    is_channel_member?: boolean; // Mock for now
}

interface TeamSidebarProps {
    team: {
        id: number;
        name: string;
        description?: string;
        profile_photo_url?: string;
    };
    channels: Channel[];
    activeChannelId: number | null;
    onSelectChannel: (channelId: number) => void;
    onShowSettings: () => void;
    isOwner: boolean;
    isMember: boolean;
    currentUserId: string;
}

export function TeamSidebar({
    team,
    channels,
    activeChannelId,
    onSelectChannel,
    onShowSettings,
    isOwner,
    isMember,
    currentUserId
}: TeamSidebarProps) {
    const socket = useSocket();
    // Track unread messages per channel: { channelId: count }
    const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});

    // Listen to socket events for new messages
    useEffect(() => {
        if (!socket || !currentUserId) return;

        const handleChannelMessageNotification = (data: any) => {
            console.log('🔔 TeamSidebar received channelMessageNotification:', {
                channelId: data.channelId,
                userId: data.userId,
                currentUserId,
                activeChannelId,
                shouldIncrement: data.userId !== currentUserId && data.channelId !== activeChannelId
            });

            // Only increment unread if:
            // 1. Message is NOT from current user
            // 2. Message is NOT in the active channel
            if (data.userId !== currentUserId && data.channelId !== activeChannelId) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [data.channelId]: (prev[data.channelId] || 0) + 1
                }));
                console.log('✅ Incremented unread count for channel:', data.channelId);
            }
        };

        socket.on('channelMessageNotification', handleChannelMessageNotification);

        return () => {
            socket.off('channelMessageNotification', handleChannelMessageNotification);
        };
    }, [socket, currentUserId, activeChannelId]);

    // Clear unread count when channel is selected
    useEffect(() => {
        if (activeChannelId !== null) {
            setUnreadCounts(prev => {
                const newCounts = { ...prev };
                delete newCounts[activeChannelId];
                return newCounts;
            });
        }
    }, [activeChannelId]);

    // Organize channels (parents and children)
    const organizedChannels = channels.filter(c => !c.parentId).map(parent => ({
        ...parent,
        children: channels.filter(c => c.parentId === parent.id)
    }));

    return (
        <div className="w-64 bg-gray-100 flex flex-col border-r border-gray-300 h-full">
            {/* Team Header */}
            <div className="p-4 border-b border-gray-300 bg-white shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link href="/teams">
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1 text-gray-500 hover:text-gray-900">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Avatar className="h-10 w-10 rounded-lg border border-gray-200">
                        <AvatarImage src={team.profile_photo_url} alt={team.name} className="object-cover" />
                        <AvatarFallback className="rounded-lg bg-gray-100 text-gray-600 font-bold">
                            {team.name ? team.name.substring(0, 2).toUpperCase() : 'TE'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 truncate text-sm">{team.name}</h2>
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="text-xs text-gray-500 hover:text-gray-700 truncate w-full text-left flex items-center gap-1 group">
                                    <span className="truncate">{team.description || 'Sin descripción'}</span>
                                    <Info className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs w-full p-3 text-sm text-gray-600 bg-white break-words" side="right" align="start">
                                <p className="font-medium text-gray-900 mb-1">Descripción</p>
                                {team.description || 'No hay descripción disponible para este equipo.'}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Header Canales */}
            <div className="px-4 py-2 flex justify-between items-center bg-gray-50/50 mt-1">
                <h3 className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Canales</h3>
                {isOwner && (
                    <CreateChannelModal teamId={team.id} />
                )}
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {organizedChannels.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            No hay canales
                        </div>
                    )}

                    {organizedChannels.map(channel => (
                        <div key={channel.id} className="space-y-1">
                            {/* Parent Channel Item */}
                            <ChannelItem
                                channel={channel}
                                isActive={activeChannelId === channel.id}
                                onClick={() => onSelectChannel(channel.id)}
                                isOwner={isOwner}
                                teamId={team.id}
                                unreadCount={unreadCounts[channel.id] || 0}
                            />

                            {/* Subchannels */}
                            {channel.children && channel.children.length > 0 && (
                                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                                    {channel.children.map(sub => (
                                        <ChannelItem
                                            key={sub.id}
                                            channel={sub}
                                            isActive={activeChannelId === sub.id}
                                            onClick={() => onSelectChannel(sub.id)}
                                            isSub
                                            isOwner={isOwner}
                                            teamId={team.id}
                                            unreadCount={unreadCounts[sub.id] || 0}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Footer / Settings */}
            <div className="p-4 border-t border-gray-300 bg-gray-50">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                    onClick={onShowSettings}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración de Equipo
                </Button>
            </div>
        </div>
    );
}

function ChannelItem({
    channel,
    isActive,
    onClick,
    isSub,
    isOwner,
    teamId,
    unreadCount = 0
}: {
    channel: Channel,
    isActive: boolean,
    onClick: () => void,
    isSub?: boolean,
    isOwner?: boolean,
    teamId?: number,
    unreadCount?: number
}) {
    return (
        <div className={cn(
            "w-full flex items-center rounded-md transition-colors group relative",
            isActive ? "bg-white shadow-sm" : "hover:bg-gray-200"
        )}>
            <button
                onClick={onClick}
                className="flex-1 flex items-center px-3 py-2 text-sm text-left truncate"
            >
                {channel.isPrivate ? (
                    <Lock className={cn("h-3.5 w-3.5 mr-2", isActive ? "text-yellow-700" : "text-gray-400")} />
                ) : (
                    <Hash className={cn("h-3.5 w-3.5 mr-2", isActive ? "text-yellow-700" : "text-gray-400 group-hover:text-gray-500")} />
                )}

                <span className={cn("truncate", isActive ? "text-yellow-700 font-medium" : "text-gray-600 group-hover:text-gray-900")}>
                    {channel.name}
                </span>

                {/* Unread count badge */}
                {unreadCount > 0 && !isActive && (
                    <span className="ml-auto h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {!channel.is_channel_member && !channel.isPrivate && (
                    <span className="ml-auto text-[10px] text-blue-500 bg-blue-50 px-1 rounded">Ver</span>
                )}
            </button>

            {isOwner && !isSub && teamId && (
                <div className="opacity-0 group-hover:opacity-100 pr-1">
                    <CreateChannelModal teamId={teamId} parentId={channel.id} />
                </div>
            )}
        </div>
    );
}

function CreateChannelModal({ teamId, parentId }: { teamId: number, parentId?: number }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isPrivate, parent_id: parentId })
            });
            if (!res.ok) throw new Error('Failed');

            toast.success('Canal creado');
            await queryClient.invalidateQueries({ queryKey: ['team-channels', teamId] });
            setOpen(false);
            setName(''); setDescription(''); setIsPrivate(false);
        } catch (error) {
            toast.error('Error al crear canal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{parentId ? 'Crear Subcanal' : 'Crear Canal'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="nombre-del-canal" />
                    </div>
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Propósito del canal" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox checked={isPrivate} onCheckedChange={c => setIsPrivate(!!c)} id="private" />
                        <Label htmlFor="private" className="cursor-pointer">Canal Privado</Label>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>Crear</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
