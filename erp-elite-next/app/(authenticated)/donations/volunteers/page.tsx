"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Search, Filter, X, Pencil, Trash2, Mail, Phone } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce" // Using relative path is safer based on previous issue, assuming alias works though. Will stick to alias for consistency unless proven breaks. Actually user corrected me to relative before? No, wait, user asked to fix it, I fixed it to relative. I should probably use relative here too or fix alias. "use-debounce" file is in hooks. Alias @/hooks/use-debounce should work if tsconfig correct. I'll try alias first, if fails I know why. Wait, I saw tsconfig, it had "paths": {"@/*": ["./*"]}. So @/hooks... maps to ./hooks... which is root. So it should work. The errors before might be weird. I will use alias to be consistent with project style, but if user complained before I will use relative again just to be safe.
// actually relative path is safer given recent history in this session.
import VolunteerFormModal from "./components/VolunteerFormModal"

export default function VolunteersPage() {
    const queryClient = useQueryClient()
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [campaignFilter, setCampaignFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all")
    const [cityFilter, setCityFilter] = useState("all")
    const [countryFilter, setCountryFilter] = useState("all")
    const [certifiedFilter, setCertifiedFilter] = useState("all")

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null)
    const [mode, setMode] = useState<"create" | "edit">("create")

    const debouncedSearch = useDebounce(search, 300)

    // Fetch Options
    const { data: optionsData } = useQuery({
        queryKey: ["volunteers-options"],
        queryFn: async () => {
            const res = await fetch("/api/donations/volunteers/options")
            if (!res.ok) throw new Error("Failed to fetch options")
            return res.json()
        }
    })

    const campaigns = optionsData?.campaigns || []
    const statusOptions = optionsData?.statusOptions || []
    const roles = optionsData?.roles || []
    const cities = optionsData?.cities || []
    const countries = optionsData?.countries || []

    // Fetch Volunteers
    const { data: volunteersData, isLoading } = useQuery({
        queryKey: ["volunteers", page, debouncedSearch, campaignFilter, statusFilter, roleFilter, cityFilter, countryFilter, certifiedFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: "10",
            })
            if (debouncedSearch) params.append("search", debouncedSearch)
            if (campaignFilter && campaignFilter !== "all") params.append("campaign_filter", campaignFilter)
            if (statusFilter && statusFilter !== "all") params.append("status_filter", statusFilter)
            if (roleFilter && roleFilter !== "all") params.append("role_filter", roleFilter)
            if (cityFilter && cityFilter !== "all") params.append("city_filter", cityFilter)
            if (countryFilter && countryFilter !== "all") params.append("country_filter", countryFilter)
            if (certifiedFilter && certifiedFilter !== "all") params.append("certified_filter", certifiedFilter)

            const res = await fetch(`/api/donations/volunteers?${params.toString()}`)
            if (!res.ok) throw new Error("Failed to fetch volunteers")
            return res.json()
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/donations/volunteers/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete volunteer")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["volunteers"] })
            toast.success("Voluntario eliminado")
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleCreate = () => {
        setSelectedVolunteer(null)
        setMode("create")
        setIsFormOpen(true)
    }

    const handleEdit = (volunteer: any) => {
        setSelectedVolunteer(volunteer)
        setMode("edit")
        setIsFormOpen(true)
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar este voluntario?")) {
            deleteMutation.mutate(id)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setCampaignFilter("all")
        setStatusFilter("all")
        setRoleFilter("all")
        setCityFilter("all")
        setCountryFilter("all")
        setCertifiedFilter("all")
        setPage(1)
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Voluntarios</h1>
                    <p className="text-muted-foreground">Gestión de voluntarios del sistema.</p>
                </div>
                <Button onClick={handleCreate} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Voluntario
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>Búsqueda</Label>
                        <Input
                            placeholder="Nombre, email o teléfono..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Campaña</Label>
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {campaigns.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {statusOptions.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {roles.map((r: string) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Ciudad</Label>
                        <Select value={cityFilter} onValueChange={setCityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {cities.map((c: string) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>País</Label>
                        <Select value={countryFilter} onValueChange={setCountryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {countries.map((c: string) => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Certificado</Label>
                        <Select value={certifiedFilter} onValueChange={setCertifiedFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="1">Sí</SelectItem>
                                <SelectItem value="0">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border-0">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Campaña</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Certificado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell>
                            </TableRow>
                        ) : volunteersData?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No se encontraron voluntarios</TableCell>
                            </TableRow>
                        ) : (
                            volunteersData?.data?.map((volunteer: any) => (
                                <TableRow key={volunteer.id}>
                                    <TableCell className="font-medium">{volunteer.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm text-gray-500">
                                            {volunteer.email && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {volunteer.email}
                                                </div>
                                            )}
                                            {volunteer.phone && (
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {volunteer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {[volunteer.city, volunteer.country].filter(Boolean).join(', ') || '-'}
                                    </TableCell>
                                    <TableCell>{volunteer.campaign ? volunteer.campaign.name : '-'}</TableCell>
                                    <TableCell>{volunteer.role || '-'}</TableCell>
                                    <TableCell>
                                        {volunteer.status ? (
                                            <Badge
                                                variant="secondary"
                                                style={{
                                                    backgroundColor: volunteer.status.color + '20',
                                                    color: volunteer.status.color
                                                }}
                                            >
                                                {volunteer.status.name}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {volunteer.certified ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Sí</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">No</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(volunteer)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(volunteer.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {volunteersData?.meta && (
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Mostrando {((page - 1) * volunteersData.meta.per_page) + 1} a {Math.min(page * volunteersData.meta.per_page, volunteersData.meta.total)} de {volunteersData.meta.total} resultados
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(volunteersData.meta.last_page, p + 1))}
                            disabled={page >= volunteersData.meta.last_page}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <VolunteerFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                volunteer={selectedVolunteer}
                mode={mode}
                campaignOptions={campaigns}
                statusOptions={statusOptions}
            />
        </div>
    )
}
