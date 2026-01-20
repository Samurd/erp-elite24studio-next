'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form'; // Or direct fetch
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Crown, Trash, UserX, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, Loader2, Search, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command as CommandPrimitive } from 'cmdk';
import { RichSelect, RichSelectOption } from '@/components/ui/rich-select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ShieldCheck, UserMinus } from 'lucide-react';






interface TeamSettingsProps {
    team: any;
    isOwner: boolean;
    currentUserId: string;
}

export function TeamSettings({ team, isOwner, currentUserId }: TeamSettingsProps) {
    const [activeTab, setActiveTab] = useState('members');
    const queryClient = useQueryClient();
    const router = useRouter();

    return (
        <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold">{team.name} - Configuración</h2>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="members">Miembros</TabsTrigger>
                        <TabsTrigger value="settings">General</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-6">
                        <MembersList teamId={team.id} isOwner={isOwner} currentUserId={currentUserId} />
                    </TabsContent>

                    <TabsContent value="settings">
                        <GeneralSettings team={team} isOwner={isOwner} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function MembersList({ teamId, isOwner, currentUserId }: { teamId: number, isOwner: boolean, currentUserId: string }) {
    const [search, setSearch] = useState('');

    // We update the query key so tanstack query refetches when search changes
    const { data: members, isLoading, isFetching } = useQuery({
        queryKey: ['team-members', teamId, search],
        queryFn: async () => {
            const url = search
                ? `/api/teams/${teamId}/members?search=${encodeURIComponent(search)}`
                : `/api/teams/${teamId}/members`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
        },
        placeholderData: keepPreviousData
    });

    const { data: roles } = useQuery({
        queryKey: ['team-roles'],
        queryFn: async () => {
            const res = await fetch(`/api/teams/roles`);
            if (!res.ok) throw new Error('Failed to load roles');
            return res.json();
        }
    });

    const queryClient = useQueryClient();
    const router = useRouter();

    const kickMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'DELETE',
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove member');
        },
        onSuccess: () => {
            toast.success('Acción realizada correctamente');
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
            router.refresh();
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    const roleMutation = useMutation({
        mutationFn: async ({ userId, roleId }: { userId: string, roleId: number }) => {
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'PUT',
                body: JSON.stringify({ userId, roleId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update role');
        },
        onSuccess: () => {
            toast.success('Rol actualizado');
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
            router.refresh();
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    const owners = members?.filter((m: any) => m.role.slug === 'owner') || [];
    const regularMembers = members?.filter((m: any) => m.role.slug !== 'owner') || [];
    const totalMembers = (members || []).length;

    const ownerRoleId = roles?.find((r: any) => r.slug === 'owner')?.id;
    const memberRoleId = roles?.find((r: any) => r.slug === 'member')?.id;

    const MemberCard = ({ member }: { member: any }) => {
        const isMe = member.id === currentUserId;

        return (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={member.image} />
                        <AvatarFallback>{member.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            {member.name}
                            {member.role.slug === 'owner' && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px] gap-1">
                                    <Crown className="w-3 h-3" /> Owner
                                </Badge>
                            )}
                            {isMe && <Badge variant="outline" className="ml-1 text-[10px]">Tú</Badge>}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                </div>

                {/* Actions */}
                {isOwner && (
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {member.role.slug !== 'owner' && ownerRoleId && (
                                    <DropdownMenuItem onClick={() => {
                                        if (confirm('¿Hacer owner a este usuario?')) roleMutation.mutate({ userId: member.id, roleId: ownerRoleId });
                                    }}>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Promover a Owner
                                    </DropdownMenuItem>
                                )}
                                {/* PREVENT SELF DEMOTION: hide if isMe and owner */}
                                {(!isMe) && member.role.slug === 'owner' && memberRoleId && (
                                    <DropdownMenuItem onClick={() => {
                                        if (confirm('¿Degradar a miembro a este usuario?')) roleMutation.mutate({ userId: member.id, roleId: memberRoleId });
                                    }}>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Mover a miembro
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    disabled={
                                        (isMe && totalMembers <= 1) ||
                                        (isMe && member.role.slug === 'owner' && owners.length <= 1)
                                    }
                                    onClick={() => {
                                        // If myself and only one - blocked by UI logic here too
                                        if (isMe && totalMembers <= 1) return;
                                        if (isMe && member.role.slug === 'owner' && owners.length <= 1) return;

                                        const confirmMsg = isMe ? '¿Estás seguro de que quieres salir del equipo?' : '¿Eliminar miembro?';
                                        if (confirm(confirmMsg)) kickMutation.mutate(member.id);
                                    }}
                                >
                                    <UserMinus className="mr-2 h-4 w-4" />
                                    {isMe ? 'Salir del equipo' : 'Eliminar Miembro'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-semibold whitespace-nowrap">Miembros del Equipo</h3>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isOwner && (
                        <AddMemberDialog teamId={teamId} />
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Propietarios</h4>
                {owners.length > 0 ? (
                    owners.map((member: any) => (
                        <MemberCard key={member.id} member={member} />
                    ))
                ) : (
                    <div className="text-sm text-gray-400 italic pl-2">No encontrados.</div>
                )}
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex justify-between items-center">
                    Miembros
                    <Badge variant="outline">{regularMembers.length}</Badge>
                </h4>
                {regularMembers.length === 0 ? (
                    <div className="text-sm text-gray-400 italic pl-2">No hay miembros aún o no coinciden con la búsqueda.</div>
                ) : (
                    regularMembers.map((member: any) => (
                        <MemberCard key={member.id} member={member} />
                    ))
                )}
            </div>
        </div>
    );
}

function GeneralSettings({ team, isOwner }: { team: any, isOwner: boolean }) {
    const [name, setName] = useState(team.name);
    const [description, setDescription] = useState(team.description || '');
    const [isPublic, setIsPublic] = useState(team.isPublic);
    const [photo_url, setPhotoUrl] = useState(team.profile_photo_url || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/teams/upload-photo', {
                method: 'POST',
                body: data
            });
            const json = await res.json();
            if (json.success) {
                setPhotoUrl(json.url);
                toast.success('Foto subida');

                // Auto-save the photo to the team
                try {
                    const updateRes = await fetch(`/api/teams/${team.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ photo_url: json.url })
                    });
                    if (updateRes.ok) {
                        toast.success('Foto de perfil actualizada correctamente');
                        queryClient.invalidateQueries({ queryKey: ['team', team.id] });
                        queryClient.invalidateQueries({ queryKey: ['teams'] });
                        router.refresh();
                    } else {
                        toast.error('Error al guardar la foto en el perfil');
                    }
                } catch (err) {
                    console.error(err);
                    toast.error('Error al guardar la foto');
                }

            } else {
                toast.error('Error al subir foto');
            }
        } catch (error) {
            toast.error('Error al subir foto');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Updating team with:", { name, description, isPublic, photo_url });
        try {
            const res = await fetch(`/api/teams/${team.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, isPublic, photo_url })
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Equipo actualizado');
            queryClient.invalidateQueries({ queryKey: ['team', team.id] });
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            router.refresh();
        } catch (error) {
            toast.error('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿ESTÁS SEGURO? Esta acción es irreversible.')) return;
        try {
            await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
            router.push('/teams');
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    if (!isOwner) return <div className="text-gray-500">Solo el propietario puede editar la configuración.</div>;

    return (
        <div className="space-y-8 max-w-xl">
            <form onSubmit={handleUpdate} className="space-y-4">
                {/* AVATAR UPLOAD */}
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="h-24 w-24 border-2 border-dashed border-gray-300 group-hover:border-primary transition-colors">
                            <AvatarImage src={photo_url || undefined} className="object-cover" />
                            <AvatarFallback className="bg-gray-50 text-gray-400">
                                {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity text-xs font-medium">
                            Cambiar
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Nombre del Equipo</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                {/* TODO: Radio buttons for Public/Private */}
                <div className="pt-4">
                    <Button disabled={loading}>Guardar Cambios</Button>
                </div>
            </form>

            <div className="pt-6 border-t border-red-200">
                <h4 className="text-red-600 font-bold mb-2">Zona de Peligro</h4>
                <div className="bg-red-50 border border-red-200 rounded p-4 flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-red-900">Eliminar Equipo</div>
                        <div className="text-sm text-red-700">Esta acción no se puede deshacer.</div>
                    </div>
                    <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
                </div>
            </div>
        </div>
    );
}

function AddMemberDialog({ teamId }: { teamId: number }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<any>(null);
    const [selectedUserObj, setSelectedUserObj] = useState<any>(null);
    const queryClient = useQueryClient();

    // Debounce search could be added here, currently relying on simple state
    const { data: users, isLoading } = useQuery({
        queryKey: ['users-search', search],
        queryFn: async () => {
            if (!search) return [];
            const res = await fetch(`/api/users?search=${search}`);
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            return data.data || [];
        },
        enabled: search.length > 2
    });

    // Merge selected user into options if needed
    const options: RichSelectOption[] = [
        ...(selectedUserObj ? [selectedUserObj] : []),
        ...(users || []).filter((u: any) => u.id !== selectedUserObj?.id)
    ].map((u: any) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        ...u
    }));

    const addMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserId) return;
            const res = await fetch(`/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add member');
            return data;
        },
        onSuccess: () => {
            toast.success('Miembro agregado correctamente');
            setOpen(false);
            setSelectedUserId(null);
            setSelectedUserObj(null);
            setSearch('');
            queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
        },
        onError: (err: any) => {
            toast.error(err.message);
        }
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Agregar Miembro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Agregar nuevo miembro</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <RichSelect
                            label="Buscar Usuario"
                            placeholder="Escribe nombre (min 3 chars)..."
                            options={options}
                            value={selectedUserId}
                            onValueChange={(val) => {
                                setSelectedUserId(val);
                                const found = options.find(o => o.id === val);
                                if (found) setSelectedUserObj(found);
                                else if (!val) setSelectedUserObj(null);
                            }}
                            onSearchChange={setSearch}
                            searchValue={search}
                            shouldFilter={false}
                            imageKey="image"
                        />
                        {isLoading && <p className="text-xs text-muted-foreground">Buscando...</p>}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={() => addMutation.mutate()}
                            disabled={!selectedUserId || addMutation.isPending}
                        >
                            {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Agregar al Equipo
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
