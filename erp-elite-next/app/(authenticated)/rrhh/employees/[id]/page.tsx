"use client"

import { EmployeeForm } from "../components/EmployeeForm"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const isEditing = id !== "create";

    const { data: employee, isLoading: isLoadingEmployee } = useQuery({
        queryKey: ["employee", id],
        queryFn: async () => {
            const res = await fetch(`/api/rrhh/employees/${id}`);
            if (!res.ok) throw new Error("Failed to fetch employee");
            return res.json();
        },
        enabled: isEditing
    });

    const { data: options, isLoading: isLoadingOptions } = useQuery({
        queryKey: ["rrhh-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        }
    });

    if (isEditing && isLoadingEmployee || isLoadingOptions) {
        return <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    }

    return (
        <div className="p-6">
            <EmployeeForm
                initialData={employee}
                isEditing={isEditing}
                departments={options?.departments || []}
                genderOptions={options?.genderOptions || []}
                educationOptions={options?.educationOptions || []}
                maritalStatusOptions={options?.maritalStatusOptions || []}
            />
        </div>
    )
}
