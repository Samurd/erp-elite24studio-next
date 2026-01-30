"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichSelect } from "@/components/ui/rich-select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Plus,
    Calendar,
    DollarSign,
    User,
    MapPin,
    Briefcase,
    CheckCircle,
    Building,
    Clock,
    FileText,
    Activity
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ModelAttachments from "@/components/cloud/ModelAttachments";
import PlannerBoard from "@/app/(authenticated)/planner/components/PlannerBoard";
import { ProjectFormModal } from "../components/ProjectFormModal";
import PlannerGantt from "@/app/(authenticated)/planner/components/PlannerGantt";

export default function ProjectDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("info");
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [viewMode, setViewMode] = useState<"board" | "gantt">("board");


    // Fetch project
    const { data: project, isLoading } = useQuery({
        queryKey: ["project", id],
        queryFn: async () => {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) throw new Error("Failed to fetch project");
            return res.json();
        },
    });

    // Auto-select first plan when project loads
    useEffect(() => {
        if (project?.plans?.length > 0 && !selectedPlanId) {
            setSelectedPlanId(project.plans[0].id.toString());
        }
    }, [project, selectedPlanId]);

    // Fetch planner options (for planner tab)
    const { data: plannerOptions } = useQuery({
        queryKey: ["plannerOptions"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options?slugs=estado_tarea,prioridad_tarea");
            if (!res.ok) throw new Error("Failed to fetch planner options");
            const data = await res.json();
            return {
                states: data.estado_tarea || [],
                priorities: data.prioridad_tarea || [],
            };
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete project");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Proyecto eliminado exitosamente");
            router.push("/projects");
        },
        onError: () => {
            toast.error("Error al eliminar el proyecto");
        },
    });

    // Create plan mutation
    const createPlanMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/planner/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: project.plans?.length > 0
                        ? `Plan ${project.plans.length + 1} - ${project.name}`
                        : `Plan General - ${project.name}`,
                    description: "Plan de trabajo generado automáticamente",
                    projectId: parseInt(id),
                    teamId: project.teamId ? parseInt(project.teamId) : null
                }),
            });
            if (!res.ok) throw new Error("Failed to create plan");
            return res.json();
        },
        onSuccess: (newPlan) => {
            toast.success("Plan creado exitosamente");
            queryClient.invalidateQueries({ queryKey: ["project", id] });
            setSelectedPlanId(newPlan.id.toString());
        },
        onError: () => {
            toast.error("Error al crear el plan");
        },
    });

    const handleDelete = () => {
        if (
            confirm(
                "¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
            )
        ) {
            deleteMutation.mutate();
        }
    };

    const formatDate = (date?: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleString("es-CO");
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "default";
        const lower = statusName.toLowerCase();
        if (lower.includes("activo")) return "default";
        if (lower.includes("proceso") || lower.includes("progreso")) return "secondary";
        if (lower.includes("completado")) return "default";
        if (lower.includes("pausado")) return "secondary";
        if (lower.includes("cancelado")) return "destructive";
        return "default";
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">Cargando...</div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-gray-500">Proyecto no encontrado</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Detalles del Proyecto</h1>
                        <p className="text-gray-600 mt-1">{project.name}</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" asChild>
                            <Link href="/projects">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => setShowEditModal(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-white data-[state=active]:text-yellow-700 data-[state=active]:shadow-sm rounded-md px-6 py-2 transition-all flex items-center gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Información General
                    </TabsTrigger>
                    <TabsTrigger
                        value="plans"
                        className="data-[state=active]:bg-white data-[state=active]:text-yellow-700 data-[state=active]:shadow-sm rounded-md px-6 py-2 transition-all flex items-center gap-2"
                    >
                        <Briefcase className="h-4 w-4" />
                        Planes ({project.plans?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6 animate-in fade-in-50 duration-300">

                    {/* Header Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* <Card>
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Inicio
                                </span>
                                <span className="text-lg font-bold text-slate-800">
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                                </span>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Fin Estimado
                                </span>
                                <span className="text-lg font-bold text-slate-800">
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : "-"}
                                </span>
                            </CardContent>
                        </Card> */}
                        {/* <Card>
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" /> Presupuesto
                                </span>
                                <span className="text-lg font-bold text-emerald-600">
                                    {project.budget ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(project.budget)) : "-"}
                                </span>
                            </CardContent>
                        </Card> */}
                        <Card>
                            <CardContent className="p-4 flex flex-col gap-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-4 w-4" /> Estado
                                </span>
                                <div>
                                    {project.status ? (
                                        <Badge variant={getStatusColor(project.status.name)} className="rounded-md">
                                            {project.status.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-slate-500 font-medium">No asignado</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Main Info Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-yellow-600" />
                                        Descripción
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {project.description || "Sin descripción detallada."}
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-slate-500">
                                        <MapPin className="h-4 w-4" />
                                        {project.direction || "Dirección no especificada"}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-yellow-600" />
                                        Etapas del Proyecto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                                        {project.stages?.map((stage: any, index: number) => (
                                            <div key={stage.id} className="relative">
                                                <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 ${project.currentStageId === stage.id ? 'bg-yellow-500 border-yellow-100 ring-4 ring-yellow-50' : 'bg-slate-200 border-white'}`} />
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${project.currentStageId === stage.id ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {stage.name}
                                                        </span>
                                                        {project.currentStageId === stage.id && (
                                                            <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-100">
                                                                Actual
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {stage.description && (
                                                        <p className="text-sm text-slate-400">{stage.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-yellow-600" />
                                        Involucrados
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">Cliente / Contacto</span>
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {project.contact?.name?.substring(0, 2).toUpperCase() || "NA"}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{project.contact?.name || "No asignado"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">Responsable Interno</span>
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                                {project.responsible?.name?.substring(0, 2).toUpperCase() || "NA"}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{project.responsible?.name || "No asignado"}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-medium uppercase text-muted-foreground">Tipo de Proyecto</span>
                                        <div className="p-2">
                                            <Badge variant="outline" className="w-full justify-center py-1">
                                                <Building className="mr-2 h-3 w-3" />
                                                {project.projectType?.name || "General"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-yellow-600" />
                                        Documentos
                                    </CardTitle>
                                    <CardDescription>
                                        Archivos y adjuntos del proyecto
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ModelAttachments
                                        initialFiles={project.files || []}
                                        modelId={project.id}
                                        modelType="Project"
                                        onUpdate={() => {
                                            queryClient.invalidateQueries({ queryKey: ["project", parseInt(id)] });
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Plans Tab */}
                <TabsContent value="plans" className="p-6">
                    {project.plans && project.plans.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Plan de Trabajo</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex bg-slate-100 p-1 rounded-md">
                                        <button
                                            onClick={() => setViewMode("board")}
                                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all ${viewMode === "board" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            Tablero
                                        </button>
                                        <button
                                            onClick={() => setViewMode("gantt")}
                                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all ${viewMode === "gantt" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                                        >
                                            Gantt
                                        </button>
                                    </div>

                                    {project.plans.length > 1 && (
                                        <div className="w-[200px]">
                                            <RichSelect
                                                options={project.plans}
                                                value={parseInt(selectedPlanId)}
                                                onValueChange={(val) => setSelectedPlanId(val.toString())}
                                                placeholder="Seleccionar plan"
                                                showAvatar={false}
                                            />
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => createPlanMutation.mutate()}
                                        disabled={createPlanMutation.isPending}
                                    >
                                        {createPlanMutation.isPending ? (
                                            <span className="animate-spin mr-2">⏳</span>
                                        ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                        )}
                                        Nuevo Plan
                                    </Button>
                                </div>
                            </div>

                            {selectedPlanId && (
                                <div className="h-[600px] border rounded-lg overflow-hidden" style={{ clipPath: 'inset(0 round 8px)' }}>
                                    {viewMode === "board" ? (
                                        <PlannerBoard
                                            planId={parseInt(selectedPlanId)}
                                            planName={project.plans.find((p: any) => p.id.toString() === selectedPlanId)?.name}
                                        />
                                    ) : (
                                        <PlannerGantt
                                            planId={parseInt(selectedPlanId)}
                                            planName={project.plans.find((p: any) => p.id.toString() === selectedPlanId)?.name}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
                            <p className="text-lg font-medium">No hay planes asociados</p>
                            <p className="text-sm mt-2 mb-4">
                                Este proyecto no tiene ningún plan de trabajo activo.
                            </p>
                            {/* TODO: Implement Create Plan functionality */}
                            <Button
                                onClick={() => createPlanMutation.mutate()}
                                disabled={createPlanMutation.isPending}
                            >
                                {createPlanMutation.isPending ? "Creando..." : "Crear Plan de Trabajo"}
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>


            {/* Edit Modal */}
            {
                showEditModal && (
                    <ProjectFormModal
                        projectId={parseInt(id)}
                        onClose={() => setShowEditModal(false)}
                        onSuccess={() => {
                            setShowEditModal(false);
                            queryClient.invalidateQueries({ queryKey: ["project", id] });
                        }}
                    />
                )
            }
        </div >
    );
}
