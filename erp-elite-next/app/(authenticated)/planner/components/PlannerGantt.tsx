"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Gantt from "frappe-gantt";
import "./frappe-gantt.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import CreateTaskModal from "./CreateTaskModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PlannerGanttProps {
    planId: number;
    planName?: string;
}

export default function PlannerGantt({ planId, planName }: PlannerGanttProps) {
    const ganttRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");
    const [ganttInstance, setGanttInstance] = useState<any>(null);

    // Modal state for creating/editing tasks
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);


    const { data: plan, isLoading, error } = useQuery({
        queryKey: ["plan", planId],
        queryFn: async () => {
            const res = await fetch(`/api/planner/plans/${planId}`);
            if (!res.ok) throw new Error("Failed to fetch plan");
            return res.json();
        }
    });

    useEffect(() => {
        if (!plan || !ganttRef.current) return;

        // 1. Flatten tasks from buckets
        const tasks: any[] = [];
        plan.buckets.forEach((bucket: any) => {
            if (bucket.tasks) {
                bucket.tasks.forEach((task: any) => {
                    if (task.startDate && task.dueDate) {
                        tasks.push({
                            id: task.id.toString(),
                            name: task.title,
                            start: task.startDate,
                            end: task.dueDate,
                            progress: 0, // You can calculate this if you have subtasks or a progress field
                            dependencies: "", // You can add dependencies if you have them
                            custom_class: getPriorityClass(task.priority?.name),
                            _task: task // Store original task for click handler
                        });
                    }
                });
            }
        });

        if (tasks.length === 0) {
            if (ganttRef.current) ganttRef.current.innerHTML = "<div class='text-center p-10 text-gray-400'>No hay tareas con fechas asignadas para mostrar en el Gantt.</div>";
            return;
        }

        // Clear previous instance
        if (ganttRef.current) ganttRef.current.innerHTML = "";

        // 2. Initialize Gantt
        const gantt = new Gantt(ganttRef.current, tasks, {
            header_height: 50,
            column_width: 30,
            step: 24,
            view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
            bar_height: 25,
            bar_corner_radius: 3,
            arrow_curve: 5,
            padding: 18,
            view_mode: viewMode,
            date_format: 'YYYY-MM-DD',
            language: 'es', // or 'en'
            on_click: (task: any) => {
                if (task._task) {
                    setEditingTask(task._task);
                    setSelectedBucketId(task._task.bucketId);
                    setIsTaskModalOpen(true);
                }
            },
            on_date_change: (task: any, start: Date, end: Date) => {
                // Update task dates via API
                handleDateChange(task.id, start, end);
            },
            on_progress_change: (task: any, progress: number) => {
                console.log(task, progress);
            },
            on_view_change: (mode: string) => {
                console.log(mode);
            }
        });

        setGanttInstance(gantt);

    }, [plan, viewMode]);

    const handleDateChange = async (taskId: string, start: Date, end: Date) => {
        try {
            // Format dates as YYYY-MM-DD
            const startDate = format(start, "yyyy-MM-dd");
            const dueDate = format(end, "yyyy-MM-dd");

            await fetch(`/api/planner/tasks/${taskId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, dueDate })
            });

            // Invalidate query to refresh data (optional, or just let local state be out of sync briefly)
            // queryClient.invalidateQueries({ queryKey: ["plan", planId] }); 
        } catch (error) {
            console.error("Failed to update task dates", error);
        }
    };

    const getPriorityClass = (priority?: string) => {
        if (!priority) return "bar-blue";
        const lower = priority.toLowerCase();
        if (lower.includes("alta") || lower.includes("high") || lower.includes("urgente")) return "bar-red"; // You need to define these CSS classes
        if (lower.includes("media") || lower.includes("medium")) return "bar-orange";
        return "bar-blue";
    };

    if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>;
    if (error) return <div className="p-8 text-red-500">Error cargando el plan.</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200 isolate z-0">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    Gantt View - {planName || plan.name}
                </h3>
                <div className="flex items-center gap-4">
                    <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Vista" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Day">Día</SelectItem>
                            <SelectItem value="Week">Semana</SelectItem>
                            <SelectItem value="Month">Mes</SelectItem>
                        </SelectContent>
                    </Select>
                    {/* Add Task Button (Optional) */}
                    {plan.buckets?.length > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setEditingTask(null);
                                setSelectedBucketId(plan.buckets[0].id); // Default to first bucket
                                setIsTaskModalOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 custom-gantt-container relative" style={{ contain: 'paint' }}>
                <div ref={ganttRef} className="w-full h-full min-h-[500px]"></div>
            </div>

            <CreateTaskModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                bucketId={selectedBucketId}
                initialData={editingTask}
                planId={planId}
                planMembers={plan.team?.members || []}
                states={plan.states || []}
                priorities={plan.priorities || []}
            />

            <style jsx global>{`
                .bar-red .bar { fill: #ef4444 !important; }
                .bar-red .bar-progress { fill: #b91c1c !important; }
                
                .bar-orange .bar { fill: #f97316 !important; }
                .bar-orange .bar-progress { fill: #c2410c !important; }
                
                .bar-blue .bar { fill: #3b82f6 !important; }
                .bar-blue .bar-progress { fill: #1d4ed8 !important; }

                /* Fix for frappe-gantt scrollbar */
                .gantt-container {
                     height: 100%;
                     overflow: auto;
                }
            `}</style>
        </div>
    );
}
