'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CreateTeamModal } from './components/CreateTeamModal';
import { TeamCard } from './components/TeamCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamsIndexPage() {
    const [filters, setFilters] = useState({
        search: '',
        isPublicFilter: 'all', // 'all', '1', '0'
        perPage: '20' // Increased for grid view
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ['teams', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.isPublicFilter !== 'all') params.append('isPublicFilter', filters.isPublicFilter);
            params.append('perPage', filters.perPage);

            const res = await fetch(`/api/teams?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch teams');
            return res.json();
        }
    });

    const clearFilters = () => {
        setFilters({
            search: '',
            isPublicFilter: 'all',
            perPage: '20'
        });
    };

    const hasActiveFilters = filters.search !== '' || filters.isPublicFilter !== 'all';

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] bg-gray-50/50">
            {/* Top Toolbar */}
            <div className="flex-none bg-white border-b px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            Equipos
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona tus equipos, colaboraciones y proyectos.
                        </p>
                    </div>
                    <CreateTeamModal />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar equipos por nombre..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="pl-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            value={filters.isPublicFilter}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, isPublicFilter: val }))}
                        >
                            <SelectTrigger className="w-[180px] bg-gray-50/50 border-gray-200">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Tipo de equipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tipos</SelectItem>
                                <SelectItem value="1">Públicos</SelectItem>
                                <SelectItem value="0">Privados</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                className="h-10 px-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    <div className="ml-auto flex items-center text-sm text-muted-foreground">
                        <span className="font-medium text-foreground mx-1">{isLoading ? '...' : (data?.total || 0)}</span>
                        equipos encontrados
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="h-[200px] w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[250px]" />
                                    <Skeleton className="h-4 w-[200px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="rounded-full bg-red-100 p-3 mb-4">
                            <Users className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Error al cargar equipos</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-2">
                            Hubo un problema al intentar obtener la lista de equipos. Por favor intenta nuevamente.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                            Reintentar
                        </Button>
                    </div>
                ) : data?.data?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {data.data.map((team: any) => (
                            <TeamCard key={team.id} team={team} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No se encontraron equipos</h3>
                        <p className="text-sm text-gray-500 max-w-sm mt-2">
                            No hay equipos que coincidan con tus filtros de búsqueda. Intenta ajustar los términos.
                        </p>
                        <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">
                            Limpiar todos los filtros
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
