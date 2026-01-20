"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, FileSignature, ExternalLink } from "lucide-react"
import ApprovalTable from "./components/ApprovalTable"
import ApprovalFormModal from "./components/ApprovalFormModal"
import ApprovalDetailModal from "./components/ApprovalDetailModal"
import { Toaster } from "sonner"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApprovalsPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 300)
    const [page, setPage] = useState(1)

    // Tabs state
    const [mainTab, setMainTab] = useState("received") // received, sent
    const [subTab, setSubTab] = useState("aprobaciones") // aprobaciones, contratos, solicitud

    // Modals state
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [editingApproval, setEditingApproval] = useState<any>(null)
    const [viewingApproval, setViewingApproval] = useState<any>(null)

    // Fetch Options (Priorities & Users)
    const { data: options } = useQuery({
        queryKey: ["approvals-options"],
        queryFn: async () => {
            const res = await fetch("/api/approvals/options")
            if (!res.ok) throw new Error("Failed to load options")
            return res.json()
        }
    })

    // Fetch Approvals
    const { data: approvalsData, isLoading } = useQuery({
        queryKey: ["approvals", mainTab, subTab, page, debouncedSearch],
        queryFn: async () => {
            // Logic to filter contracts (if separate endpoint or just hidden for now as per vue logic which had a link)
            if (subTab === 'contratos') return { data: [], meta: { total: 0 } }

            const query = new URLSearchParams({
                page: page.toString(),
                search: debouncedSearch,
                type: mainTab,
                subTab: subTab,
                per_page: "6"
            })
            const res = await fetch(`/api/approvals?${query.toString()}`)
            if (!res.ok) throw new Error("Failed to load approvals")
            return res.json()
        },
        placeholderData: (previousData) => previousData
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/approvals/${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error deleting approval")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approvals"] })
            toast.success("Solicitud eliminada")
        },
        onError: () => toast.error("Error al eliminar la solicitud")
    })

    // Handlers
    const handleCreate = () => {
        setEditingApproval(null)
        setIsFormOpen(true)
    }

    const handleEdit = (approval: any) => {
        setEditingApproval(approval)
        setIsFormOpen(true)
    }

    const handleView = (id: number) => {
        // Fetch full details for view (or pass object if complete enough, usually separate fetch for relations)
        // For simplicity using client fetch inside modal or pre-fetch here.
        // Let's pre-fetch here or set ID and let modal fetch.
        // Modal expects full object. Let's fetch it.
        fetch(`/api/approvals/${id}`)
            .then(res => res.json())
            .then(data => {
                setViewingApproval(data)
                setIsDetailOpen(true)
            })
            .catch(() => toast.error("Error al cargar detalles"))
    }

    const handleDelete = (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta solicitud?")) {
            deleteMutation.mutate(id)
        }
    }

    const renderApprovalsContent = () => (
        <>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 w-full bg-gray-100 animate-pulse rounded" />
                    ))}
                </div>
            ) : (
                <ApprovalTable
                    approvals={approvalsData?.data || []}
                    isSent={mainTab === 'sent'}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Pagination */}
            {approvalsData?.meta && approvalsData.meta.last_page > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Anterior
                    </Button>
                    <span className="flex items-center text-sm text-gray-600">
                        Página {page} de {approvalsData.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(approvalsData.meta.last_page, p + 1))}
                        disabled={page === approvalsData.meta.last_page}
                    >
                        Siguiente
                    </Button>
                </div>
            )}
        </>
    )

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6">
            <Toaster position="top-right" />

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Aprobaciones</h1>
                    <p className="text-gray-500 mt-2">Gestiona tus solicitudes y aprobaciones pendientes.</p>
                </div>
                {/* Search */}
                {/* <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar solicitud..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div> */}
                {/* Search is implicit in some tabs, but useful generally */}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow border border-gray-200 min-h-[600px]">

                {/* Main Tabs (Simulating Vue Tabs) */}
                <div className="flex justify-between items-center border-b border-gray-200 text-sm px-5">
                    <div className="flex">
                        <button
                            className={`px-5 py-3 focus:outline-none ${mainTab === 'received' ? 'border-b-2 border-yellow-700 font-bold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => { setMainTab('received'); setSubTab('aprobaciones'); setPage(1) }}
                        >
                            Recibida
                        </button>
                        <button
                            className={`px-5 py-3 focus:outline-none ${mainTab === 'sent' ? 'border-b-2 border-yellow-700 font-bold text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => { setMainTab('sent'); setSubTab('aprobaciones'); setPage(1) }}
                        >
                            Enviada
                        </button>
                    </div>
                </div>

                {/* Sub Tabs & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 px-5 py-3">
                    <div className="flex space-x-6 text-sm font-medium">
                        <button onClick={() => { setSubTab('aprobaciones'); setPage(1) }}
                            className={subTab === 'aprobaciones' ? 'text-yellow-700 border-b-[3px] border-yellow-700 pb-1' : 'text-gray-400 hover:text-gray-600'}>
                            Aprobaciones
                        </button>
                        <button onClick={() => { setSubTab('contratos'); setPage(1) }}
                            className={subTab === 'contratos' ? 'text-yellow-700 border-b-[3px] border-yellow-700 pb-1' : 'text-gray-400 hover:text-gray-600'}>
                            Contratos/Firmas
                        </button>
                        <button onClick={() => { setSubTab('solicitud'); setPage(1) }}
                            className={subTab === 'solicitud' ? 'text-yellow-700 border-b-[3px] border-yellow-700 pb-1' : 'text-gray-400 hover:text-gray-600'}>
                            Solicitud de Compra
                        </button>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Button onClick={handleCreate} className="bg-yellow-700 hover:bg-yellow-800 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Nueva solicitud
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-5">
                    {subTab === 'contratos' ? (
                        <div className="flex items-center justify-center p-10 bg-white rounded-lg border border-dashed border-gray-300 min-h-[400px]">
                            <div className="text-center">
                                <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                                    <FileSignature className="h-10 w-10 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Portal de Firmas Odoo</h3>
                                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                    Por políticas de seguridad, el panel de firmas debe abrirse en una ventana segura.
                                </p>
                                <a href="https://elite-24-studio-sas.odoo.com/odoo/sign-documents" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-700 hover:bg-yellow-800 focus:outline-none">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir Panel de Firmas
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-12 w-full bg-gray-100 animate-pulse rounded" />
                                    ))}
                                </div>
                            ) : (
                                <ApprovalTable
                                    approvals={approvalsData?.data || []}
                                    isSent={mainTab === 'sent'}
                                    onView={handleView}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            )}

                            {/* Pagination */}
                            {approvalsData?.meta && approvalsData.meta.last_page > 1 && (
                                <div className="flex justify-center mt-6 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="flex items-center text-sm text-gray-600">
                                        Página {page} de {approvalsData.meta.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(approvalsData.meta.last_page, p + 1))}
                                        disabled={page === approvalsData.meta.last_page}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ApprovalFormModal
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                approval={editingApproval}
                mode={editingApproval ? "edit" : "create"}
                priorities={options?.priorities || []}
                users={options?.users?.map((u: any) => ({ id: u.id.toString(), name: u.name, image: u.image })) || []}
            />

            <ApprovalDetailModal
                open={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                approval={viewingApproval}
            />
        </div>
    )
}
