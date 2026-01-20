"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react";

interface TaskCardProps {
    task: any;
    onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
    // Priority Colors
    const getPriorityColor = (limit: number) => {
        // Mock fallback if relation not fully populated or using IDs
        // Assuming we get priority object from relation
        if (task.priority?.name === 'Alta' || task.priority?.name === 'Urgente') return "bg-red-50 text-red-700 border-red-100";
        if (task.priority?.name === 'Media') return "bg-orange-50 text-orange-700 border-orange-100";
        return "bg-slate-50 text-slate-500 border-slate-100"; // Low or None
    };

    return (
        <div
            onClick={onClick}
            className="bg-white p-3 rounded-md border border-slate-200 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer group relative"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight">
                    {task.title}
                </h4>
                {/* <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1">
                    <Trash2 className="h-3 w-3" />
                </button> */}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
                {task.status && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {task.status.name}
                    </span>
                )}
                {task.priority && (
                    <span className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border",
                        getPriorityColor(1)
                    )}>
                        {task.priority.name}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {task.dueDate && (
                        <span className={cn(
                            "flex items-center gap-1",
                            new Date(task.dueDate) < new Date() ? "text-red-500 font-semibold" : ""
                        )}>
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.dueDate), "MMM d")}
                        </span>
                    )}
                </div>
                {/* Avatars placeholder */}
                <div className="flex -space-x-1.5">
                    {/* {task.assignedUsers?.map((u: any) => (
                        <div key={u.id} className="h-5 w-5 rounded-full bg-yellow-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                            {u.name.substring(0,2).toUpperCase()}
                        </div>
                    ))} */}
                </div>
            </div>
        </div>
    );
}
