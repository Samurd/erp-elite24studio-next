"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
// Removed ModelAttachmentsCreator import
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"
import { useQuery, useQueryClient } from "@tanstack/react-query" // Added useQuery import

interface NormsFormModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: any
    mode: 'create' | 'edit' | 'view'
}

export function NormsFormModal({ isOpen, onClose, initialData, mode }: NormsFormModalProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full data using useQuery
    const { data: fetchedData, isLoading: isLoadingQuery, refetch } = useQuery({
        queryKey: ["norm", initialData?.id],
        queryFn: async () => {
            if (!initialData?.id) return null;
            const res = await fetch(`/api/finances/norms/${initialData.id}`);
            if (!res.ok) throw new Error("Failed to fetch norm");
            return res.json();
        },
        enabled: isOpen && !!initialData?.id && (mode === 'edit' || mode === 'view'),
        initialData: initialData
    });

    const activeData = fetchedData || initialData;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
        }
    })

    useEffect(() => {
        if (isOpen) {
            if (activeData && (mode === 'edit' || mode === 'view')) {
                reset({
                    name: activeData.name || activeData.title || "",
                })
            } else {
                reset({
                    name: "",
                })
            }
        }
    }, [isOpen, activeData, mode, reset])

    const onSubmit = async (data: any) => {
        if (mode === 'view') return;

        setIsSubmitting(true)
        try {
            // Upload files via ref
            const uploadedFileIds = await attachmentsRef.current?.upload() || []

            const payload = {
                ...data,
                pending_file_ids: uploadedFileIds
            }

            if (mode === 'create') {
                const res = await fetch("/api/finances/norms", {
                    method: "POST",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" }
                })

                if (!res.ok) throw new Error("Error al crear norma")

                toast.success("Norma creada exitosamente")

            } else if (mode === 'edit') {
                const res = await fetch(`/api/finances/norms/${activeData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" }
                })
                if (!res.ok) throw new Error("Error al actualizar norma")

                toast.success("Norma actualizada exitosamente")
            }

            queryClient.invalidateQueries({ queryKey: ["norms"] })
            if (activeData?.id) {
                queryClient.invalidateQueries({ queryKey: ["norm", activeData.id] })
            }

            router.refresh()
            onClose()

        } catch (error) {
            console.error(error)
            toast.error("Ocurrió un error")
        } finally {
            setIsSubmitting(false)
        }
    }

    const title = mode === 'create' ? 'Nueva Norma' : (mode === 'edit' ? 'Editar Norma' : 'Detalle de Norma')
    const isReadOnly = mode === 'view';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {mode === 'view' ? `Información detallada de la norma #${activeData?.id}` : 'Complete los campos para guardar la norma.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                {...register("name", { required: "El nombre es obligatorio" })}
                                disabled={isReadOnly}
                            />
                            {errors.name && <span className="text-red-500 text-sm">{errors.name.message as string}</span>}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4">Archivos Adjuntos</h3>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="finanzas"
                            initialFiles={activeData?.files || []}
                            modelId={activeData?.id}
                            modelType="App\Models\Norm"
                            onUpdate={() => refetch()}
                        />
                    </div>

                    {!isReadOnly && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {mode === 'create' ? 'Crear' : 'Actualizar'}
                            </Button>
                        </DialogFooter>
                    )}
                    {isReadOnly && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    )
}
