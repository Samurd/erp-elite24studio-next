'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, Users, User, Link as LinkIcon, Share2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RichSelect } from '@/components/ui/rich-select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CloudItem {
    id: number;
    type: 'file' | 'folder';
    name: string;
}

interface ShareModalProps {
    item: CloudItem | null;
    isOpen: boolean;
    onClose: () => void;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Team {
    id: number;
    name: string;
}

interface ExistingShare {
    id: number;
    permission: string;
    sharedWithUserId: string | null;
    sharedWithTeamId: number | null;
    user_sharedWithUserId?: User;
    team?: Team;
}

interface PublicLink {
    url: string;
    expires_at: string | null;
    token: string;
}

interface ShareData {
    users: User[];
    teams: Team[];
    shares: ExistingShare[];
    publicLink: PublicLink | null;
}

export default function ShareModal({ item, isOpen, onClose }: ShareModalProps) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('users');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [permission, setPermission] = useState('view');
    const [expirationDate, setExpirationDate] = useState('');

    // Reset state when modal opens/closes or item changes
    useEffect(() => {
        if (!isOpen) {
            setSelectedUser('');
            setSelectedTeam('');
            setPermission('view');
            setExpirationDate('');
            setActiveTab('users');
        }
    }, [isOpen, item]);

    // Fetch share data
    const { data, isLoading } = useQuery<ShareData>({
        queryKey: ['share-data', item?.type, item?.id],
        queryFn: async () => {
            if (!item) return { users: [], teams: [], shares: [], publicLink: null };
            const res = await fetch(`/api/cloud/share/data?type=${item.type}&id=${item.id}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            return res.json();
        },
        enabled: !!item && isOpen
    });

    // Share with user/team mutation
    const shareMutation = useMutation({
        mutationFn: async (payload: any) => {
            const res = await fetch(`/api/cloud/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to share');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Compartido exitosamente');
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
            setSelectedUser('');
            setSelectedTeam('');
        },
        onError: () => toast.error('Error al compartir')
    });

    // Remove share mutation
    const deleteShareMutation = useMutation({
        mutationFn: async (shareId: number) => {
            const res = await fetch(`/api/cloud/share/remove/${shareId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete share');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Permiso eliminado');
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
        },
        onError: () => toast.error('Error al eliminar permiso')
    });

    // Generate/Delete public link mutation
    const publicLinkMutation = useMutation({
        mutationFn: async (action: 'create' | 'delete') => {
            const url = '/api/cloud/share/public-link';
            const method = action === 'create' ? 'POST' : 'DELETE';
            const body = action === 'create'
                ? { type: item?.type, id: item?.id, expires_at: expirationDate || null }
                : { type: item?.type, id: item?.id };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Failed to manage public link');
            return res.json();
        },
        onSuccess: () => {
            toast.success('Enlace público actualizado');
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
        },
        onError: () => toast.error('Error con el enlace público')
    });

    const handleShare = () => {
        if (!item) return;

        if (activeTab === 'users' && !selectedUser) {
            toast.error('Selecciona un usuario');
            return;
        }
        if (activeTab === 'teams' && !selectedTeam) {
            toast.error('Selecciona un grupo');
            return;
        }

        shareMutation.mutate({
            type: item.type,
            id: item.id,
            user_id: activeTab === 'users' ? selectedUser : undefined,
            team_id: activeTab === 'teams' ? parseInt(selectedTeam) : undefined,
            permission
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado al portapapeles');
    };

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-600" />
                        Compartir <span className="text-yellow-600 truncate max-w-[200px] inline-block align-bottom">{item.name}</span>
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="users">Usuarios</TabsTrigger>
                            <TabsTrigger value="teams">Grupos</TabsTrigger>
                            <TabsTrigger value="link">Enlace Público</TabsTrigger>
                        </TabsList>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Buscar Usuario</Label>
                                <RichSelect
                                    options={data?.users.map(user => ({ id: user.id.toString(), name: `${user.name} (${user.email})` })) || []}
                                    value={selectedUser}
                                    onValueChange={setSelectedUser}
                                    placeholder="Seleccionar usuario..."
                                    label=""
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Permisos</Label>
                                <Select value={permission} onValueChange={setPermission}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">Solo ver</SelectItem>
                                        <SelectItem value="edit">Editar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleShare} disabled={shareMutation.isPending} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                                {shareMutation.isPending ? 'Compartiendo...' : 'Compartir'}
                            </Button>
                        </TabsContent>

                        {/* Teams Tab */}
                        <TabsContent value="teams" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Buscar Grupo</Label>
                                <RichSelect
                                    options={data?.teams.map(team => ({ id: team.id.toString(), name: team.name })) || []}
                                    value={selectedTeam}
                                    onValueChange={setSelectedTeam}
                                    placeholder="Seleccionar grupo..."
                                    label=""
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Permisos</Label>
                                <Select value={permission} onValueChange={setPermission}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">Solo ver</SelectItem>
                                        <SelectItem value="edit">Editar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button onClick={handleShare} disabled={shareMutation.isPending} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white">
                                {shareMutation.isPending ? 'Compartiendo...' : 'Compartir'}
                            </Button>
                        </TabsContent>

                        {/* Public Link Tab */}
                        <TabsContent value="link" className="space-y-4">
                            {data?.publicLink ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-green-800">Enlace activo</span>
                                            <span className="text-xs text-green-600">
                                                Expira: {data.publicLink.expires_at ? new Date(data.publicLink.expires_at).toLocaleDateString() : 'Nunca'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={data.publicLink.url}
                                                className="flex-1 text-xs p-2 rounded border border-gray-300 bg-white"
                                            />
                                            <Button size="icon" variant="outline" onClick={() => copyToClipboard(data.publicLink.url)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() => publicLinkMutation.mutate('delete')}
                                        disabled={publicLinkMutation.isPending}
                                        className="w-full"
                                    >
                                        Desactivar enlace
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Expiración (Opcional)</Label>
                                        <input
                                            type="date"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={expirationDate}
                                            onChange={(e) => setExpirationDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg text-center" >
                                        <LinkIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500 mb-4">Genera un enlace público para compartir con cualquier persona.</p>
                                        <Button
                                            onClick={() => publicLinkMutation.mutate('create')}
                                            disabled={publicLinkMutation.isPending}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Generar Enlace
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Existing Shares List */}
                {!isLoading && data && data.shares.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">Accesos concedidos</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                            {data.shares.map((share: ExistingShare) => (
                                <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="cursor-help">
                                                    {share.sharedWithTeamId ? (
                                                        <Users className="w-4 h-4 text-purple-500" />
                                                    ) : (
                                                        <User className="w-4 h-4 text-blue-500" />
                                                    )}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{share.sharedWithTeamId ? 'Grupo' : 'Usuario'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <div>
                                            <span className="font-medium">
                                                {share.sharedWithTeamId ? share.team?.name : share.user_sharedWithUserId?.name}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({share.permission === 'edit' ? 'Edición' : 'Ver'})
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                            if (confirm('¿Quitar acceso?')) {
                                                deleteShareMutation.mutate(share.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
