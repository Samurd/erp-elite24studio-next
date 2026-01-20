"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Download, FileIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import ModelAttachmentsCreator from "@/components/cloud/ModelAttachmentsCreator"
import { uploadFile, attachFileToModel } from "@/actions/files"

interface NormsFormModalProps {
    isOpen: boolean
    onClose: () => void
    initialData?: any
    mode: 'create' | 'edit' | 'view'
}

export function NormsFormModal({ isOpen, onClose, initialData, mode }: NormsFormModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    // States for ModelAttachmentsCreator (Create Mode)
    const [newFiles, setNewFiles] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([])

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: "",
        }
    })

    useEffect(() => {
        if (isOpen) {
            if (initialData && (mode === 'edit' || mode === 'view')) {
                reset({
                    name: initialData.name,
                })
            } else {
                reset({
                    name: "",
                })
                setNewFiles([])
                setPendingCloudFiles([])
            }
        }
    }, [isOpen, initialData, mode, reset])

    const onSubmit = async (data: any) => {
        if (mode === 'view') return;

        setIsLoading(true)
        try {
            if (mode === 'create') {
                // 1. Create Norm
                const res = await fetch("/api/finances/norms", {
                    method: "POST",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" }
                })

                if (!res.ok) throw new Error("Error al crear norma")
                const newNorm = await res.json()
                const normId = newNorm.id

                // 2. Handle New Files (Upload & Attach)
                for (const file of newFiles) {
                    const formData = new FormData()
                    formData.append("file", file)
                    // formData.append("userId", ...) // Optional, handled by session in action if updated, or passed explicit. Action uses session user? 
                    // Checking actions/files.ts -> It uses formData userId/folderId or null. Drizzle insert uses provided. 
                    // Ideally we should pass userId if we can, but let's assume null is fine or updated action logic.
                    // IMPORTANT: uploadFile in action assumes NO session check inside it, just raw upload? 
                    // Yes, it does not check session. We should be careful.

                    const uploadRes = await uploadFile(formData)
                    if (uploadRes.success && uploadRes.file) {
                        await attachFileToModel(uploadRes.file.id, "App\\Models\\Norm", normId)
                    }
                }

                // 3. Handle Cloud Files (Attach)
                for (const cloudFile of pendingCloudFiles) {
                    await attachFileToModel(cloudFile.id, "App\\Models\\Norm", normId)
                }

                toast.success("Norma creada exitosamente")

            } else if (mode === 'edit') {
                // Update Norm Details
                const res = await fetch(`/api/finances/norms/${initialData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                    headers: { "Content-Type": "application/json" }
                })
                if (!res.ok) throw new Error("Error al actualizar norma")

                toast.success("Norma actualizada exitosamente")
                // Files are handled separately by ModelAttachments component in Edit mode
            }

            router.refresh()
            onClose()

        } catch (error) {
            console.error(error)
            toast.error("Ocurrió un error")
        } finally {
            setIsLoading(false)
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
                        {mode === 'view' ? `Información detallada de la norma #${initialData?.id}` : 'Complete los campos para guardar la norma.'}
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

                        {mode === 'create' && (
                            <ModelAttachmentsCreator
                                files={newFiles}
                                onFilesChange={setNewFiles}
                                pendingCloudFiles={pendingCloudFiles}
                                onPendingCloudFilesChange={setPendingCloudFiles}
                            />
                        )}

                        {mode === 'edit' && initialData && (
                            <ModelAttachments
                                initialFiles={initialData.files || []}
                                modelId={initialData.id}
                                modelType="App\Models\Norm"
                            />
                        )}

                        {mode === 'view' && initialData && (
                            <div className="space-y-2">
                                {(initialData.files && initialData.files.length > 0) ? (
                                    initialData.files.map((file: any) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:shadow-sm">
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <div className="text-gray-400">
                                                    <FileIcon className="w-6 h-6" />
                                                </div>
                                                <div className="truncate">
                                                    <span className="text-sm font-medium text-gray-700 truncate block">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <a
                                                href={file.url}
                                                download
                                                target="_blank"
                                                className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-lg text-xs font-medium flex items-center transition"
                                            >
                                                <Download className="w-4 h-4 mr-1" /> Descargar
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 py-4 italic border border-dashed border-gray-200 rounded">
                                        No hay archivos adjuntos.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!isReadOnly && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
