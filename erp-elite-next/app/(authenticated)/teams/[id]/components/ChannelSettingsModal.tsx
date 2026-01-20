'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
                body: JSON.stringify({ name, description })
            });

            if (!res.ok) throw new Error('Failed to update channel');

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
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">Tipo:</span>
                                <span>{channel.isPrivate ? 'Privado' : 'Público'}</span>
                            </div>
                            {isOwner && (
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
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

                                {isOwner && teamMembers.filter(tm => !members.some(m => m.id === tm.id)).length > 0 && (
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
                                                <div className="text-center text-sm text-gray-500 py-4">
                                                    {searchQuery ? 'No se encontraron miembros' : 'No hay miembros disponibles'}
                                                </div>
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
                    )}
                </Tabs>
            </DialogContent >
        </Dialog >
    );
}
