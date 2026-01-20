"use client"

import { useQuery } from "@tanstack/react-query"
import { ContractForm } from "../components/ContractForm"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"
import { use } from "react"

export default function ContractPage({ params }: { params: Promise<{ id: string }> }) {
    const searchParams = useSearchParams()
    const { id } = use(params)
    const isCreating = id === "create"
    const isEditing = searchParams.get("edit") === "true" || isCreating
    const isReadOnly = !isEditing

    const { data: options, isLoading: isLoadingOptions } = useQuery({
        queryKey: ["rrhh-options"],
        queryFn: async () => {
            const res = await fetch("/api/rrhh/options");
            if (!res.ok) throw new Error("Failed to fetch options");
            return res.json();
        }
    })

    const { data: contract, isLoading: isLoadingContract } = useQuery({
        queryKey: ["contract", id],
        queryFn: async () => {
            if (isCreating) return null;
            const res = await fetch(`/api/rrhh/contracts/${id}`);
            if (!res.ok) throw new Error("Failed to fetch contract");
            return res.json();
        },
        enabled: !isCreating
    })

    if (isLoadingOptions || (isLoadingContract && !isCreating)) {
        return <div className="p-6"><Skeleton className="h-[600px] w-full" /></div>
    }

    return (
        <div className="p-6">
            <ContractForm
                initialData={contract}
                isEditing={isEditing}
                isReadOnly={isReadOnly}
                employees={options?.employees || []}
                typeOptions={options?.typeOptions || []}
                categoryOptions={options?.categoryOptions || []}
                statusOptions={options?.statusOptions || []}
                scheduleOptions={options?.scheduleOptions || []}
            />
        </div>
    )
}
