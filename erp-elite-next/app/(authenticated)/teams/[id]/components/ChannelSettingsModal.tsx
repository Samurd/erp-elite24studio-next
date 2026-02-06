'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChannelSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    channel: any;
    teamId: number;
    isOwner: boolean;
}

export function ChannelSettingsModal({ open, onOpenChange, channel, teamId, isOwner }: ChannelSettingsModalProps) {
    const { data: session } = authClient.useSession();
    const [name, setName] = useState(channel.name);
    const [description, setDescription] = useState(channel.description || '');
    const [isPrivate, setIsPrivate] = useState(channel.isPrivate);
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    // Fetch channel members (for private channels)
    const fetchChannelMembers = async () => {
        if (!channel.isPrivate) return;
        setLoadingMembers(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/channels/${channel.id}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch (error) {
            console.error('Error fetching channel members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    // Fetch team members (to add to channel)
    const fetchTeamMembers = async () => {
        if (!channel.isPrivate) return;
        try {
            const res = await fetch(`/api/teams/${teamId}`);
            if (res.ok) {
                const data = await res.json();
                setTeamMembers(data.members || []);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        }
    };

    // Load members when dialog opens
    useEffect(() => {
        setIsPrivate(channel.isPrivate);
        if (open && channel.isPrivate) {
            fetchChannelMembers();
            fetchTeamMembers();
        }
    }, [open, channel.isPrivate, channel.id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwner) {
            toast.error('Solo el propietario puede editar el canal');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/channels/${channel.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isPrivate })
            });

            if (!res.ok) throw new Error('Failed to update channel');

            // If switching from successfully Public -> Private, add current user as member
            // so they don't lose visibility of the channel they just edited.
            if (!channel.isPrivate && isPrivate && session?.user?.id) {
                try {
                    await fetch(`/api/teams/${teamId}/channels/${channel.id}/members`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: session.user.id })
                    });
                    // Refresh members list silently just in case
                    fetchChannelMembers();
                } catch (memberError) {
                    console.error('Failed to auto-add owner to private channel', memberError);
                }
            }

            toast.success('Canal actualizado');
            queryClient.invalidateQueries({ queryKey: ['team-channels', teamId] });
            queryClient.invalidateQueries({ queryKey: ['team', teamId] });
            onOpenChange(false);
        } catch (error) {
            toast.error('Error al actualizar canal');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!isOwner) {
            toast.error('Solo el propietario puede agregar miembros');
            return;
        }

        try {
            const res = await fetch(`/api/teams/${teamId}/channels/${channel.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!res.ok) throw new Error('Failed to add member');

            toast.success('Miembro agregado');
            fetchChannelMembers();
        } catch (error) {
            toast.error('Error al agregar miembro');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!isOwner) {
            toast.error('Solo el propietario puede remover miembros');
            return;
        }

        try {
            const res = await fetch(`/api/teams/${teamId}/channels/${channel.id}/members/${userId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to remove member');

            toast.success('Miembro removido');
            fetchChannelMembers();
        } catch (error) {
            toast.error('Error al remover miembro');
        }
    };

    const handleDeleteChannel = async () => {
        if (!isOwner) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teams/${teamId}/channels/${channel.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete channel');

            toast.success('Canal eliminado');
            queryClient.invalidateQueries({ queryKey: ['team-channels', teamId] });
            onOpenChange(false);
        } catch (error) {
            toast.error('Error al eliminar canal');
            setLoading(false);
        }
    };

    // Filter available members by search query
    const availableMembers = teamMembers
        .filter(tm => !members.some(m => m.id === tm.id))
        .filter(tm => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return tm.name?.toLowerCase().includes(query) || tm.email?.toLowerCase().includes(query);
        });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Configuración del Canal</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        {channel.isPrivate && <TabsTrigger value="members">Miembros</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 pt-4">
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre del Canal</Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder="nombre-del-canal"
                                    disabled={!isOwner}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Propósito del canal"
                                    rows={3}
                                    disabled={!isOwner}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="isPrivate"
                                    checked={isPrivate}
                                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                                    disabled={!isOwner}
                                />
                                <Label htmlFor="isPrivate">Canal Privado</Label>
                            </div>
                            {isOwner && (
                                <div className="flex flex-col gap-4 pt-4">
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                                        </Button>
                                    </div>

                                    <div className="border-t pt-4 mt-2">
                                        <h4 className="text-sm font-medium text-red-600 mb-2">Zona de Peligro</h4>
                                        <div className="bg-red-50 p-3 rounded-md flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-red-900">Eliminar este canal</p>
                                                <p className="text-xs text-red-700">Esta acción no se puede deshacer.</p>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" type="button" disabled={loading}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Susat seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el canal
                                                            <span className="font-bold"> {channel.name} </span>
                                                            y todos sus mensajes.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDeleteChannel} className="bg-red-600 hover:bg-red-700">
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </TabsContent>

                    {channel.isPrivate && (
                        <TabsContent value="members" className="space-y-4 pt-4">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium mb-2">Miembros del Canal ({members.length})</h3>
                                    <ScrollArea className="h-[200px] border rounded-md p-2">
                                        {loadingMembers ? (
                                            <div className="text-center text-sm text-gray-500 py-4">Cargando...</div>
                                        ) : members.length === 0 ? (
                                            <div className="text-center text-sm text-gray-500 py-4">No hay miembros</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {members.map(member => (
                                                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={member.profile_photo_url} />
                                                                <AvatarFallback>{member.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium">{member.name}</p>
                                                                <p className="text-xs text-gray-500">{member.email}</p>
                                                            </div>
                                                        </div>
                                                        {isOwner && member.id !== session?.user?.id && (
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleRemoveMember(member.id)}
                                                                className="h-8 w-8"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {member.id === session?.user?.id && (
                                                            <span className="text-xs text-gray-500 italic">Tú</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>

                                {isOwner && (
                                    <div>
                                        <h3 className="font-medium mb-2">Agregar Miembros</h3>
                                        <div className="mb-2">
                                            <Input
                                                placeholder="Buscar por nombre o email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <ScrollArea className="h-[200px] border rounded-md p-2">
                                            {availableMembers.length === 0 ? (
                                                searchQuery ? (
                                                    <div className="text-center text-sm text-gray-500 py-4">No se encontraron miembros</div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-3">
                                                        <div className="bg-gray-100 p-3 rounded-full">
                                                            <UserPlus className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-gray-900">No hay miembros disponibles</p>
                                                            <p className="text-xs text-gray-500">
                                                                Para agregar personas a este canal, primero deben ser miembros del equipo.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                <div className="space-y-2">
                                                    {availableMembers.map(member => (
                                                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={member.profile_photo_url} />
                                                                    <AvatarFallback>{member.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-medium">{member.name}</p>
                                                                    <p className="text-xs text-gray-500">{member.email}</p>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleAddMember(member.id)}
                                                                className="h-8 w-8"
                                                            >
                                                                <UserPlus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )
                    }
                </Tabs >
            </DialogContent >
        </Dialog >
    );
}
