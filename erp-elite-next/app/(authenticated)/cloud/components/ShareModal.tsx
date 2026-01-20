'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Trash2, Users, User, Link as LinkIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ShareModalProps {
    show: boolean;
    item: { id: number; type: 'file' | 'folder'; name: string } | null;
    onClose: () => void;
}

interface ShareUser {
    id: number;
    name: string;
    email: string;
}

interface ShareTeam {
    id: number;
    name: string;
}

interface ExistingShare {
    id: number;
    permission: string;
    shared_with_user_id: number | null;
    shared_with_team_id: number | null;
    shared_with_user?: ShareUser;
    shared_with_team?: ShareTeam;
}

interface PublicLink {
    url: string;
    expires_at: string | null;
    token: string;
}

interface ShareData {
    users: ShareUser[];
    teams: ShareTeam[];
    shares: ExistingShare[];
    publicLink: PublicLink | null;
}

export default function ShareModal({ show, item, onClose }: ShareModalProps) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('users');
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [userPermission, setUserPermission] = useState('view');
    const [teamPermission, setTeamPermission] = useState('view');
    const [expiresAt, setExpiresAt] = useState('');

    // Fetch share data
    const { data, isLoading } = useQuery<ShareData>({
        queryKey: ['share-data', item?.type, item?.id],
        queryFn: async () => {
            if (!item) return null;
            const res = await fetch(`/api/cloud/share/data?type=${item.type}&id=${item.id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: show && !!item
    });

    // Share with user mutation
    const shareUserMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/cloud/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item?.type,
                    id: item?.id,
                    user_id: parseInt(selectedUser),
                    permission: userPermission
                })
            });
            if (!res.ok) throw new Error('Failed to share');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
            setSelectedUser('');
        }
    });

    // Share with team mutation
    const shareTeamMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/cloud/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item?.type,
                    id: item?.id,
                    team_id: parseInt(selectedTeam),
                    permission: teamPermission
                })
            });
            if (!res.ok) throw new Error('Failed to share');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
            setSelectedTeam('');
        }
    });

    // Remove share mutation
    const removeMutation = useMutation({
        mutationFn: async (shareId: number) => {
            const res = await fetch(`/api/cloud/share/${shareId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
        }
    });

    // Generate public link mutation
    const generateLinkMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/cloud/share/public-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item?.type,
                    id: item?.id,
                    expires_at: expiresAt || null
                })
            });
            if (!res.ok) throw new Error('Failed to generate link');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
            setExpiresAt('');
        }
    });

    // Delete public link mutation
    const deleteLinkMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/cloud/share/public-link`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: item?.type,
                    id: item?.id
                })
            });
            if (!res.ok) throw new Error('Failed to delete link');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['share-data', item?.type, item?.id] });
        }
    });

    const copyLink = () => {
        if (data?.publicLink?.url) {
            navigator.clipboard.writeText(data.publicLink.url);
        }
    };

    useEffect(() => {
        if (show) {
            setActiveTab('users');
            setSelectedUser('');
            setSelectedTeam('');
            setExpiresAt('');
        }
    }, [show]);

    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">
                        Compartir <span className="text-yellow-600">{item?.name}</span>
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                    </div>
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="users">Usuarios</TabsTrigger>
                            <TabsTrigger value="teams">Grupos</TabsTrigger>
                            <TabsTrigger value="link">Enlace Público</TabsTrigger>
                        </TabsList>

                        {/* Users Tab */}
                        <TabsContent value="users" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Usuario</Label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar usuario..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.users.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.name} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Permiso</Label>
                                <Select value={userPermission} onValueChange={setUserPermission}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">Solo Lectura</SelectItem>
                                        <SelectItem value="edit">Editar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={() => shareUserMutation.mutate()}
                                disabled={!selectedUser || shareUserMutation.isPending}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                                Compartir
                            </Button>
                        </TabsContent>

                        {/* Teams Tab */}
                        <TabsContent value="teams" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Grupo</Label>
                                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar grupo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data?.teams.map((team) => (
                                            <SelectItem key={team.id} value={team.id.toString()}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Permiso</Label>
                                <Select value={teamPermission} onValueChange={setTeamPermission}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="view">Solo Lectura</SelectItem>
                                        <SelectItem value="edit">Editar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                onClick={() => shareTeamMutation.mutate()}
                                disabled={!selectedTeam || shareTeamMutation.isPending}
                                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                                Compartir
                            </Button>
                        </TabsContent>

                        {/* Public Link Tab */}
                        <TabsContent value="link" className="space-y-4 pt-4">
                            {!data?.publicLink ? (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Expiración (Opcional)</Label>
                                        <Input
                                            type="date"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={() => generateLinkMutation.mutate()}
                                        disabled={generateLinkMutation.isPending}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Generar Enlace
                                    </Button>
                                </>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="text"
                                            readOnly
                                            value={data.publicLink.url}
                                            className="flex-1 bg-white text-sm"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={copyLink}
                                            className="text-gray-500 hover:text-blue-600"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>
                                            Expira: {data.publicLink.expires_at ? new Date(data.publicLink.expires_at).toLocaleDateString() : 'Nunca'}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('¿Eliminar enlace público?')) {
                                                    deleteLinkMutation.mutate();
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-auto p-1 px-2"
                                        >
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Existing Shares */}
                {data && data.shares.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Accesos Concedidos
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {data.shares.map((share) => (
                                <div key={share.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                            {share.shared_with_team_id ? (
                                                <Users className="w-4 h-4" />
                                            ) : (
                                                <User className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {share.shared_with_team_id
                                                    ? share.shared_with_team?.name
                                                    : share.shared_with_user?.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 uppercase font-medium">{share.permission === 'view' ? 'Solo Lectura' : 'Editor'}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            if (confirm('¿Quitar acceso?')) {
                                                removeMutation.mutate(share.id);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                    >
                                        <Trash2 className="w-4 h-4" />
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
