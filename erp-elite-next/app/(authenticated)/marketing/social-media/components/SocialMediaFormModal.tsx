"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RichSelect } from "@/components/ui/rich-select"
import { toast } from "sonner"
import { Share2 } from "lucide-react"
import ModelAttachments, { ModelAttachmentsRef } from "@/components/cloud/ModelAttachments"

interface SocialMediaFormModalProps {
    open: boolean
    onClose: () => void
    post?: any | null // If null, it's create mode
    statusOptions: any[]
    responsibleOptions: any[]
    projectOptions: any[]
}

export default function SocialMediaFormModal({ open, onClose, post: initialPost, statusOptions, responsibleOptions, projectOptions }: SocialMediaFormModalProps) {
    const isEdit = !!initialPost
    const queryClient = useQueryClient()
    const attachmentsRef = useRef<ModelAttachmentsRef>(null)

    // Fetch full post details incase initialPost is incomplete or stale
    const { data: fetchedPost } = useQuery({
        queryKey: ["social-media-post", initialPost?.id],
        queryFn: async () => {
            if (!initialPost?.id) return null
            const res = await fetch(`/api/marketing/social-media/${initialPost.id}`)
            if (!res.ok) throw new Error("Failed to fetch post")
            return res.json()
        },
        enabled: open && !!initialPost?.id,
        staleTime: 0,
        refetchOnMount: true,
    })

    const activePost = fetchedPost?.data || initialPost

    const [formData, setFormData] = useState({
        piece_name: "",
        mediums: "",
        content_type: "",
        scheduled_date: "",
        project_id: "",
        responsible_id: "",
        status_id: "",
        comments: "",
    })

    const [files, setFiles] = useState<File[]>([])
    const [pendingCloudFiles, setPendingCloudFiles] = useState<any[]>([])

    useEffect(() => {
        if (activePost && isEdit) {
            setFormData({
                piece_name: activePost.pieceName || "",
                mediums: activePost.mediums || "",
                content_type: activePost.contentType || "",
                scheduled_date: activePost.scheduledDate ? activePost.scheduledDate.split('T')[0] : "",
                project_id: activePost.projectId ? activePost.projectId.toString() : "",
                responsible_id: activePost.responsibleId || "",
                status_id: activePost.statusId ? activePost.statusId.toString() : "",
                comments: activePost.comments || "",
            })
        } else {
            setFormData({
                piece_name: "",
                mediums: "",
                content_type: "",
                scheduled_date: "",
                project_id: "",
                responsible_id: "",
                status_id: "",
                comments: "",
            })
        }
    }, [activePost, open, isEdit])

    useEffect(() => {
        if (!open) {
            setFiles([])
            setPendingCloudFiles([])
        }
    }, [open])

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEdit ? `/api/marketing/social-media/${activePost.id}` : "/api/marketing/social-media"
            const method = isEdit ? "PUT" : "POST"

            const allFileIds = await attachmentsRef.current?.upload() || []

            const payload = {
                ...data,
                pending_file_ids: allFileIds
            };

            console.log("[MUTATION] Sending to API:", {
                url,
                method,
                payload,
                responsible_id: payload.responsible_id,
                responsible_id_type: typeof payload.responsible_id
            });

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || "Error saving post")
            }
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["social-media-posts"] })
            if (activePost?.id) {
                queryClient.invalidateQueries({ queryKey: ["social-media-post", activePost.id] })
            }
            toast.success(isEdit ? "Publicación actualizada" : "Publicación creada")
            onClose()
        },
        onError: (error: any) => {
            toast.error(error.message)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        mutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Share2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle>{isEdit ? "Editar Publicación" : "Nueva Publicación"}</DialogTitle>
                            <DialogDescription>
                                {isEdit ? "Actualiza la información de la publicación" : "Complete los datos para registrar un nuevo contenido para redes"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Piece Name */}
                        <div className="lg:col-span-2 space-y-2">
                            <Label htmlFor="piece_name">Nombre de Pieza / Post *</Label>
                            <Input
                                id="piece_name"
                                value={formData.piece_name}
                                onChange={(e) => setFormData({ ...formData, piece_name: e.target.value })}
                                placeholder="Ej: Post Navidad LinkedIn"
                                required
                            />
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado *</Label>
                            <Select value={formData.status_id} onValueChange={(val) => setFormData({ ...formData, status_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.id} value={option.id.toString()}>{option.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="mediums">Medios / Canales</Label>
                            <Input
                                id="mediums"
                                value={formData.mediums}
                                onChange={(e) => setFormData({ ...formData, mediums: e.target.value })}
                                placeholder="Ej: Instagram, LinkedIn"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content_type">Tipo de Contenido</Label>
                            <Input
                                id="content_type"
                                value={formData.content_type}
                                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                                placeholder="Ej: Reel, Post, Story"
                            />
                        </div>
                    </div>

                    {/* Date & Assignments */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_date">Fecha Programada</Label>
                            <Input
                                id="scheduled_date"
                                type="date"
                                value={formData.scheduled_date}
                                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project_id">Proyecto</Label>
                            <Select value={formData.project_id} onValueChange={(val) => setFormData({ ...formData, project_id: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sin Proyecto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((project) => (
                                        <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="responsible">Responsable</Label>
                            <RichSelect
                                options={responsibleOptions}
                                value={formData.responsible_id && formData.responsible_id !== "" ? formData.responsible_id : undefined}
                                onValueChange={(val) => setFormData({ ...formData, responsible_id: val || "" })}
                                placeholder="Seleccionar responsable"
                                showAvatar={true}
                                imageKey="profile_photo_url"
                            />
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-2">
                        <Label htmlFor="comments">Comentarios / Copy</Label>
                        <Textarea
                            id="comments"
                            value={formData.comments}
                            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                            placeholder="Texto del post, notas de diseño..."
                            rows={4}
                        />
                    </div>

                    {/* Files */}
                    <div className="border-t pt-4">
                        <Label className="block mb-3">Archivos Adjuntos</Label>
                        <ModelAttachments
                            ref={attachmentsRef}
                            areaSlug="marketing"
                            modelId={activePost?.id}
                            modelType={"App\\Models\\SocialMediaPost"}
                            initialFiles={activePost?.files || []}
                            onUpdate={() => {
                                if (activePost?.id) {
                                    queryClient.invalidateQueries({ queryKey: ["social-media-post", activePost.id] })
                                    queryClient.invalidateQueries({ queryKey: ["social-media-posts"] })
                                }
                            }}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (isEdit ? "Actualizando..." : "Guardando...") : (isEdit ? "Actualizar" : "Guardar")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
