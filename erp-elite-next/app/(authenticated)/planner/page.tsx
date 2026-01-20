"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, User, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import PlannerBoard from "./components/PlannerBoard";
import CreatePlanModal from "./components/CreatePlanModal";

interface Plan {
    id: number;
    name: string;
    description: string;
    teamId: number | null;
    ownerId: number;
    createdAt: string;
    team?: {
        id: number;
        name: string;
    };
}

interface PlannerData {
    personalPlans: Plan[];
    groupPlans: Plan[];
    myTeams: any[];
}

export default function PlannerPage() {
    const [selectedTab, setSelectedTab] = useState<"group" | "personal">("group");
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, isLoading, error, refetch } = useQuery<PlannerData>({
        queryKey: ["planner"],
        queryFn: async () => {
            const res = await fetch("/api/planner");
            if (!res.ok) throw new Error("Failed to fetch plans");
            return res.json();
        }
    });

    const activePlans = selectedTab === "group" ? data?.groupPlans : data?.personalPlans;
    const selectedPlan = activePlans?.find(p => p.id === selectedPlanId);

    // Auto-select first plan if none selected and plans exist (optional, or just leave empty state)
    // useEffect(() => {
    //     if (!selectedPlanId && activePlans?.length) {
    //         setSelectedPlanId(activePlans[0].id);
    //     }
    // }, [activePlans, selectedPlanId]);

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Planificador</h1>
                    <p className="text-slate-500">Gestiona tus tareas y proyectos.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Crear Plan
                </Button>
            </div>

            <Separator />

            {/* Tabs & Plan Selector */}
            <div className="space-y-4">
                <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 w-fit">
                    <button
                        onClick={() => { setSelectedTab("group"); setSelectedPlanId(null); }}
                        className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            selectedTab === "group"
                                ? "bg-white text-yellow-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <Users className="mr-2 h-4 w-4" /> Otros planes/proyectos
                    </button>
                    <button
                        onClick={() => { setSelectedTab("personal"); setSelectedPlanId(null); }}
                        className={cn(
                            "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                            selectedTab === "personal"
                                ? "bg-white text-yellow-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                    >
                        <User className="mr-2 h-4 w-4" /> Planes personales
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 min-h-[50px]">
                    {isLoading ? (
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    ) : activePlans?.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-2">No hay planes disponibles en esta categoría.</p>
                    ) : (
                        activePlans?.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors border",
                                    selectedPlanId === plan.id
                                        ? "bg-yellow-100 border-yellow-200 text-yellow-800"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                )}
                            >
                                {plan.name}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {selectedPlanId ? (
                    <PlannerBoard planId={selectedPlanId} planName={selectedPlan?.name} />
                ) : (
                    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-slate-50/50">
                        <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Selecciona un plan</h3>
                        <p className="text-slate-500 max-w-sm mt-1">
                            Elige uno de los planes disponibles arriba para ver y gestionar sus tareas.
                        </p>
                    </div>
                )}
            </div>

            <CreatePlanModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                teams={data?.myTeams || []}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
