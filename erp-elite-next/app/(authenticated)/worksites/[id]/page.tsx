
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, Building, Info, ListChecks, ArrowLeftRight, HardHat } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";
import { DateService } from "@/lib/date-service";
import { WorksiteFormModal } from "../components/WorksiteFormModal";
import { ChangesTab } from "../components/ChangesTab";
import { PunchItemsTab } from "../components/PunchItemsTab";
import { VisitsTab } from "../components/VisitsTab";





export default function WorksiteDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data: worksite, isLoading, refetch } = useQuery({
        queryKey: ["worksite", id],
        queryFn: async () => {
            const res = await fetch(`/api/worksites/${id}`);
            if (!res.ok) throw new Error("Failed to fetch worksite");
            return res.json();
        },
    });

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta obra?")) return;
        try {
            const res = await fetch(`/api/worksites/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Obra eliminada");
            router.push("/worksites");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const getStatusColor = (statusName?: string) => {
        if (!statusName) return "bg-gray-100 text-gray-800";
        const name = statusName.toLowerCase();
        if (name.includes("activa") || name.includes("activo")) return "bg-green-100 text-green-800";
        if (name.includes("pendiente")) return "bg-yellow-100 text-yellow-800";
        if (name.includes("cancelada")) return "bg-red-100 text-red-800";
        return "bg-gray-100 text-gray-800";
    };



    if (isLoading) return <div className="p-8">Cargando...</div>;
    if (!worksite) return <div className="p-8">Obra no encontrada</div>;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="pl-0">
                            <Link href="/worksites">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                            </Link>
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{worksite.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Building className="h-4 w-4" />
                        <span>{worksite.project?.name || "Sin Proyecto"}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none mb-6">
                    <TabsTrigger
                        value="info"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
                    >
                        <Info className="h-4 w-4 mr-2" /> Información
                    </TabsTrigger>
                    <TabsTrigger
                        value="punchlist"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
                    >
                        <ListChecks className="h-4 w-4 mr-2" /> Punch Items
                    </TabsTrigger>
                    <TabsTrigger
                        value="changes"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
                    >
                        <ArrowLeftRight className="h-4 w-4 mr-2" /> Cambios
                    </TabsTrigger>
                    <TabsTrigger
                        value="visits"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2"
                    >
                        <HardHat className="h-4 w-4 mr-2" /> Visitas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Estado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {worksite.status ? (
                                    <Badge className={getStatusColor(worksite.status.name)}>
                                        {worksite.status.name}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
                            </CardHeader>
                            <CardContent className="text-lg font-semibold">
                                {worksite.type?.name || "-"}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Responsable</CardTitle>
                            </CardHeader>
                            <CardContent className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{worksite.responsible?.name || "-"}</span>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 lg:col-span-3">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Detalles Generales</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <div className="flex items-start gap-2 mb-4">
                                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Dirección</p>
                                            <p className="text-muted-foreground">{worksite.address || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-sm font-medium mr-2">Fecha Inicio:</span>
                                            <span className="text-muted-foreground">{DateService.toDisplay(worksite.startDate)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <span className="text-sm font-medium mr-2">Fecha Fin:</span>
                                            <span className="text-muted-foreground">{DateService.toDisplay(worksite.endDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="punchlist">
                    <PunchItemsTab worksiteId={parseInt(id)} />
                </TabsContent>

                <TabsContent value="changes">
                    <ChangesTab worksiteId={parseInt(id)} />
                </TabsContent>

                <TabsContent value="visits">
                    <VisitsTab worksiteId={parseInt(id)} />
                </TabsContent>
            </Tabs>

            <WorksiteFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                worksite={worksite}
            />
        </div>
    );
}
