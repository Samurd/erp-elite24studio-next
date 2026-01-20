'use client';

import { useState, useEffect } from 'react';
import { TeamSidebar } from './components/TeamSidebar';
import { TeamSettings } from './components/TeamSettings';
import { ChannelChat } from './components/ChannelChat';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface TeamDashboardProps {
    teamInitial: any;
    channelsInitial: any[];
    membersInitial: any[];
    currentUser: any;
    isMemberInitial: boolean;
    currentUserRole: any;
}

export default function TeamDashboard({
    teamInitial,
    channelsInitial,
    membersInitial,
    currentUser,
    isMemberInitial,
    currentUserRole
}: TeamDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Initial load from URL
    useEffect(() => {
        const channelIdParam = searchParams.get('channelId');
        if (channelIdParam) {
            const id = parseInt(channelIdParam);
            if (!isNaN(id)) {
                setActiveChannelId(id);
            }
        }
    }, [searchParams]);

    // React Query to keep data fresh, seeded with initial data
    const { data: team } = useQuery({
        queryKey: ['team', teamInitial.id],
        queryFn: async () => (await fetch(`/api/teams/${teamInitial.id}`)).json().then(res => res.team),
        initialData: teamInitial
    });

    const { data: channels } = useQuery({
        queryKey: ['team-channels', teamInitial.id],
        queryFn: async () => (await fetch(`/api/teams/${teamInitial.id}/channels`)).json(),
        initialData: channelsInitial,
        staleTime: 0,
        refetchOnMount: true
    });

    // Determine current view
    const safeChannels = Array.isArray(channels) ? channels : [];
    const activeChannel = safeChannels.find((c: any) => c.id === activeChannelId);

    // Permission checks
    const isOwner = currentUserRole?.slug === 'owner';
    const isMember = isMemberInitial; // TODO: Refresh from query if needed

    const handleJoinTeam = async () => {
        try {
            const res = await fetch(`/api/teams/${team.id}/join`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to join');
            toast.success('¡Te has unido al equipo!');
            router.refresh();
        } catch (error) {
            toast.error('Error al unirse');
        }
    };

    if (!isMember && !team.isPublic) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-65px)] bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
                    <p className="text-gray-600 mb-6">Este es un equipo privado y no eres miembro.</p>
                    <Button onClick={() => router.push('/teams')}>Volver</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(95vh-65px)] overflow-hidden">
            <TeamSidebar
                team={team}
                channels={channels}
                activeChannelId={activeChannelId}
                onSelectChannel={(id) => { setActiveChannelId(id); setShowSettings(false); }}
                onShowSettings={() => { setShowSettings(true); setActiveChannelId(null); }}
                isOwner={isOwner}
                isMember={isMember}
                currentUserId={currentUser.id}
            />

            <div className="flex-1 bg-white relative">
                {showSettings ? (
                    <TeamSettings team={team} isOwner={isOwner} currentUserId={currentUser.id} />
                ) : activeChannel && isMember ? (
                    <ChannelChat teamId={team.id} channel={activeChannel} isOwner={isOwner} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                            <Avatar className="w-20 h-20 rounded-xl">
                                <AvatarImage src={team.profile_photo_url} alt={team.name} className="object-cover" />
                                <AvatarFallback className="rounded-xl text-xl font-bold bg-gray-100 text-gray-500">
                                    {team.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido a {team.name}</h1>
                        <p className="text-gray-600 max-w-md mb-8">{team.description || 'Selecciona un canal para comenzar a chatear.'}</p>

                        {!isMember && (
                            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleJoinTeam}>
                                Unirse al Equipo
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
