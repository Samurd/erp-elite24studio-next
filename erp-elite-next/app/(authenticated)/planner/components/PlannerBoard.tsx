"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Settings, Trash, FolderPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TaskCard from "./TaskCard";
import EditPlanModal from "./EditPlanModal";
import CreateTaskModal from "./CreateTaskModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlannerBoardProps {
    planId: number;
    planName?: string;
}

import { DndContext, DragEndEvent, DragOverEvent, useSensor, useSensors, PointerSensor, closestCenter, DragOverlay, defaultDropAnimationSideEffects, DropAnimation } from "@dnd-kit/core";
import { arrayMove, SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

const getBucketId = (id: number) => `bucket-${id}`;
const getTaskId = (id: number) => `task-${id}`;

function SortableBucket({ bucket, children, onDelete }: { bucket: any, children: React.ReactNode, onDelete: (id: number) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: getBucketId(bucket.id),
        data: {
            type: "Bucket",
            bucket
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} className="flex-shrink-0 w-80 max-h-full flex flex-col bg-slate-100 rounded-lg border border-slate-200 shadow-sm">
            <div className="p-3 flex justify-between items-center handle cursor-grab active:cursor-grabbing hover:bg-slate-200/50 transition-colors rounded-t-lg group" {...attributes} {...listeners}>
                <h3 className="font-semibold text-slate-700 text-sm truncate px-1">{bucket.name}</h3>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-slate-400 mr-2 font-mono">{bucket.tasks?.length}</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-slate-400 hover:text-red-500 p-1 rounded-sm hover:bg-slate-200" onPointerDown={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                                if (confirm("¿Eliminar depósito?")) onDelete(bucket.id);
                            }} className="text-red-600">
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {children}
        </div>
    );
}

function SortableTask({ task, onClick }: { task: any, onClick: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: getTaskId(task.id),
        data: {
            type: "Task",
            task
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    if (isDragging) {
        return (
            <div ref={setNodeRef} style={style} className="opacity-50">
                <TaskCard task={task} onClick={onClick} />
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TaskCard task={task} onClick={onClick} />
        </div>
    );
}


export default function PlannerBoard({ planId, planName }: PlannerBoardProps) {
    const queryClient = useQueryClient();
    const [isCreateBucketOpen, setIsCreateBucketOpen] = useState(false);
    const [newBucketName, setNewBucketName] = useState("");
    const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);

    // Task Modal State
    const [editingTask, setEditingTask] = useState<any>(null); // Task type
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);

    // Draggable State
    const [activeDragItem, setActiveDragItem] = useState<any>(null); // can be task or bucket

    const { data: plan, isLoading, error } = useQuery({
        queryKey: ["plan", planId],
        queryFn: async () => {
            const res = await fetch(`/api/planner/plans/${planId}`);
            if (!res.ok) throw new Error("Failed to fetch plan");
            return res.json();
        }
    });

    const createBucketMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch("/api/planner/buckets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, plan_id: planId })
            });
            if (!res.ok) throw new Error("Failed to create bucket");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plan", planId] });
            setNewBucketName("");
            setIsCreateBucketOpen(false);
            toast.success("Depósito creado");
        },
        onError: () => toast.error("Error al crear depósito")
    });

    const createBucket = () => {
        if (!newBucketName.trim()) return;
        createBucketMutation.mutate(newBucketName);
    };

    const deleteBucketMutation = useMutation({
        mutationFn: async (bucketId: number) => {
            const res = await fetch(`/api/planner/buckets/${bucketId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete bucket");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plan", planId] });
            toast.success("Depósito eliminado");
        },
        onError: () => toast.error("Error al eliminar depósito")
    });

    const reorderBucketsMutation = useMutation({
        mutationFn: async (orderedIds: number[]) => {
            await fetch("/api/planner/buckets/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ buckets: orderedIds }) // buckets field expected by API
            });
        },
        onSuccess: () => {
            // queryClient.invalidateQueries({ queryKey: ["plan", planId] });
            // Optimistic update handled by local state or refetch if critical
            // toast.success("Orden actualizado");
        }
    });

    const reorderTasksMutation = useMutation({
        mutationFn: async (tasksUpdate: any[]) => {
            await fetch("/api/planner/tasks/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tasks: tasksUpdate })
            });
        }
    });

    const deletePlanMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/planner/plans/${planId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete plan");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["planner"] });
            window.location.reload();
        }
    });

    const openCreateTask = (bucketId: number) => {
        setSelectedBucketId(bucketId);
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const openEditTask = (task: any) => {
        setEditingTask(task);
        setSelectedBucketId(task.bucketId);
        setIsTaskModalOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const onDragStart = (event: any) => {
        if (event.active.data.current?.type === "Task") {
            setActiveDragItem(event.active.data.current.task);
            return;
        }
        if (event.active.data.current?.type === "Bucket") {
            setActiveDragItem(event.active.data.current.bucket);
            return;
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        const isActiveTask = activeData.type === "Task";
        const isOverTask = overData.type === "Task";
        const isOverBucket = overData.type === "Bucket";

        if (!isActiveTask) return;

        const activeId = activeData.task.id;
        const overId = isOverTask ? overData.task.id : overData.bucket.id;

        // Dropping Task over another Task (potentially in different bucket)
        if (isActiveTask && isOverTask) {
            const activeBucketIndex = plan.buckets.findIndex((b: any) => b.tasks.find((t: any) => t.id === activeId));
            const overBucketIndex = plan.buckets.findIndex((b: any) => b.tasks.find((t: any) => t.id === overId));

            if (activeBucketIndex !== -1 && overBucketIndex !== -1 && activeBucketIndex !== overBucketIndex) {
                const newBuckets = [...plan.buckets];
                const activeTaskIndex = newBuckets[activeBucketIndex].tasks.findIndex((t: any) => t.id === activeId);
                const activeTask = newBuckets[activeBucketIndex].tasks[activeTaskIndex];

                newBuckets[activeBucketIndex].tasks.splice(activeTaskIndex, 1);

                // Need to find where to insert. For drag over, usually we want to simulate movement.
                // Just simplistically moving to the over bucket for now so dnd-kit can reorder.
                // In dnd-kit, proper sorting between containers usually requires finding target index.

                // Since onDragOver happens frequently, we update query data to reflect "hover" state

                const overTaskIndex = newBuckets[overBucketIndex].tasks.findIndex((t: any) => t.id === overId);

                // Insert somewhat correctly
                const isBelowOverItem = over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                const newIndex = overTaskIndex >= 0 ? overTaskIndex + modifier : newBuckets[overBucketIndex].tasks.length + 1;

                activeTask.bucketId = newBuckets[overBucketIndex].id; // Update bucket ID in memory
                newBuckets[overBucketIndex].tasks.splice(newIndex, 0, activeTask);

                queryClient.setQueryData(["plan", planId], {
                    ...plan,
                    buckets: newBuckets
                });
            }
        }

        // Dropping Task over a Bucket (empty or populated)
        if (isActiveTask && isOverBucket) {
            const activeBucketIndex = plan.buckets.findIndex((b: any) => b.tasks.find((t: any) => t.id === activeId));
            const overBucketIndex = plan.buckets.findIndex((b: any) => b.id === overId);

            if (activeBucketIndex !== -1 && overBucketIndex !== -1 && activeBucketIndex !== overBucketIndex) {
                const newBuckets = [...plan.buckets];
                const activeTaskIndex = newBuckets[activeBucketIndex].tasks.findIndex((t: any) => t.id === activeId);
                const activeTask = newBuckets[activeBucketIndex].tasks[activeTaskIndex];

                newBuckets[activeBucketIndex].tasks.splice(activeTaskIndex, 1);
                activeTask.bucketId = newBuckets[overBucketIndex].id;
                newBuckets[overBucketIndex].tasks.push(activeTask);

                queryClient.setQueryData(["plan", planId], {
                    ...plan,
                    buckets: newBuckets
                });
            }
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (!activeData || !overData) return;

        const activeType = activeData.type;
        const overType = overData.type;
        const activeId = activeType === "Bucket" ? activeData.bucket.id : activeData.task.id;
        const overId = overType === "Bucket" ? overData.bucket.id : overData.task.id;

        const isActiveBucket = activeType === "Bucket";
        const isOverBucket = overType === "Bucket";

        // Bucket Reordering
        if (isActiveBucket && isOverBucket && activeId !== overId) {
            const oldIndex = plan.buckets.findIndex((b: any) => b.id === activeId);
            const newIndex = plan.buckets.findIndex((b: any) => b.id === overId);

            const newOrder = arrayMove(plan.buckets, oldIndex, newIndex);

            queryClient.setQueryData(["plan", planId], {
                ...plan,
                buckets: newOrder
            });

            reorderBucketsMutation.mutate(newOrder.map((b: any) => b.id));
        }

        // Task Reordering
        const isActiveTask = activeType === "Task";

        if (isActiveTask) {
            // Find source and destination buckets
            // Since onDragOver updates state, we just need to reorder within the destination bucket if changed

            // Better to re-calculate everything based on final position
            // But with onDragOver modifying state, getting indices is tricky.
            // Let's assume onDragOver did the heavy lifting of moving between buckets.
            // onDragEnd handles reordering within the SAME bucket now (effectively).

            const activeBucketIndex = plan.buckets.findIndex((b: any) => b.tasks.find((t: any) => t.id === activeId));

            if (activeBucketIndex !== -1) {
                const bucket = plan.buckets[activeBucketIndex];
                const oldIndex = bucket.tasks.findIndex((t: any) => t.id === activeId);
                const newIndex = bucket.tasks.findIndex((t: any) => t.id === overId);

                if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                    const newTasks = arrayMove(bucket.tasks, oldIndex, newIndex);
                    const newBuckets = [...plan.buckets];
                    newBuckets[activeBucketIndex] = { ...bucket, tasks: newTasks };

                    queryClient.setQueryData(["plan", planId], {
                        ...plan,
                        buckets: newBuckets
                    });
                }

                // Collect all tasks from all buckets to send full update (or at least the changed buckets)
                // For simplicity, let's collect tasks from the affected bucket only, or if moved, both.
                // Or simplified: iterate all tasks in all buckets and send their new positions.

                const allTasksUpdate: any[] = [];
                plan.buckets.forEach((b: any) => {
                    b.tasks.forEach((t: any, index: number) => {
                        allTasksUpdate.push({
                            id: t.id,
                            order: index,
                            bucketId: b.id
                        });
                    });
                });

                reorderTasksMutation.mutate(allTasksUpdate);
            }
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.4',
                },
            },
        }),
    };


    if (isLoading) return <div className="p-8"><Skeleton className="h-[500px] w-full" /></div>;
    if (error) return <div className="p-8 text-red-500">Error cargando el plan.</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-800">{plan.name}</h2>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditPlanModalOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" /> Configuración
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            if (confirm("¿Estás seguro de eliminar este plan completo?")) deletePlanMutation.mutate();
                        }} className="text-red-600 focus:text-red-600">
                            <Trash className="mr-2 h-4 w-4" /> Eliminar Plan
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Board Canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/50 p-6">
                <div className="flex h-full gap-6 items-start">

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragEnd={onDragEnd}
                    >
                        <SortableContext items={plan.buckets?.map((b: any) => getBucketId(b.id)) || []} strategy={horizontalListSortingStrategy}>
                            {/* Buckets */}
                            {plan.buckets?.map((bucket: any) => (
                                <SortableBucket key={bucket.id} bucket={bucket} onDelete={(id) => deleteBucketMutation.mutate(id)}>

                                    {/* Tasks Container */}
                                    <SortableContext items={bucket.tasks?.map((t: any) => getTaskId(t.id)) || []} strategy={verticalListSortingStrategy}>
                                        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[50px] scrollbar-thin scrollbar-thumb-slate-200">
                                            {bucket.tasks?.map((task: any) => (
                                                <SortableTask key={task.id} task={task} onClick={() => openEditTask(task)} />
                                            ))}
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 h-9"
                                                onClick={() => openCreateTask(bucket.id)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" /> Agregar tarea
                                            </Button>
                                        </div>
                                    </SortableContext>
                                </SortableBucket>
                            ))}
                        </SortableContext>

                        {createPortal(
                            <DragOverlay dropAnimation={dropAnimation}>
                                {activeDragItem && (activeDragItem.buckets ?
                                    <div className="w-80 h-20 bg-white rounded-lg border shadow-lg p-4 flex items-center justify-center font-bold text-slate-500 opacity-80">{activeDragItem.name}</div>
                                    : <div className="max-w-[300px]"><TaskCard task={activeDragItem} onClick={() => { }} /></div>
                                )}
                            </DragOverlay>,
                            document.body
                        )}

                    </DndContext>

                    {/* New Bucket Placeholder */}
                    <div className="flex-shrink-0 w-80">
                        {isCreateBucketOpen ? (
                            <div className="bg-white p-3 rounded-lg border border-yellow-200 shadow-md animate-in fade-in zoom-in-95 duration-200">
                                <Input
                                    autoFocus
                                    placeholder="Nombre del depósito"
                                    value={newBucketName}
                                    onChange={(e) => setNewBucketName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") createBucket();
                                        if (e.key === "Escape") setIsCreateBucketOpen(false);
                                    }}
                                    className="mb-2 h-8 text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsCreateBucketOpen(false)} className="h-7 text-xs">Cancelar</Button>
                                    <Button size="sm" onClick={createBucket} disabled={createBucketMutation.isPending} className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700 text-white">
                                        {createBucketMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                className="w-full bg-white/50 border-dashed border-slate-300 hover:border-yellow-500 hover:text-yellow-600 hover:bg-white text-slate-500 justify-start"
                                onClick={() => setIsCreateBucketOpen(true)}
                            >
                                <FolderPlus className="mr-2 h-4 w-4" /> Nuevo depósito
                            </Button>
                        )}
                    </div>

                </div>
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
            {plan && (
                <EditPlanModal
                    isOpen={isEditPlanModalOpen}
                    onClose={() => setIsEditPlanModalOpen(false)}
                    plan={plan}
                />
            )}
        </div>
    );
}
