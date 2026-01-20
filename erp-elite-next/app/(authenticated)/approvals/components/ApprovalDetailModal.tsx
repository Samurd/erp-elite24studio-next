"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink, ClipboardCheck } from "lucide-react"
import ModelAttachments from "@/components/cloud/ModelAttachments"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ApprovalDetailModalProps {
    open: boolean
    onClose: () => void
    approval: any | null
}

export default function ApprovalDetailModal({
    open,
    onClose,
    approval
}: ApprovalDetailModalProps) {
    const queryClient = useQueryClient()
    const { data: session } = authClient.useSession()
    const [comment, setComment] = useState("")

    // Calculate status flags
    const currentUserApprover = approval?.approvers?.find((a: any) => a.userId === session?.user?.id)
    const isMainStatusFinal = ['Aprobado', 'Rechazado'].includes(approval?.status?.name)
    const isUserDone = ['Aprobado', 'Rechazado'].includes(currentUserApprover?.status?.name)

    // Disable if main status is final OR user has already voted
    const isActionDisabled = isMainStatusFinal || isUserDone

    const approveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/approvals/${approval.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment }),
            })
            if (!res.ok) throw new Error("Error approving request")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approvals"] })
            toast.success("Solicitud aprobada")
            onClose()
            setComment("")
        },
        onError: (error: any) => toast.error(error.message)
    })

    const rejectMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/approvals/${approval.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment }),
            })
            if (!res.ok) throw new Error("Error rejecting request")
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["approvals"] })
            toast.success("Solicitud rechazada")
            onClose()
            setComment("")
        },
        onError: (error: any) => toast.error(error.message)
    })

    // Helper for status colors
    const getStatusVariant = (name: string) => {
        if (name === 'Aprobado') return 'bg-green-100 text-green-800'
        if (name === 'Rechazado') return 'bg-red-100 text-red-800'
        if (name === 'En espera') return 'bg-yellow-100 text-yellow-800'
        return 'secondary'
    }

    if (!approval) return null

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-500 text-white p-2 rounded">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <DialogTitle>Detalles de la solicitud</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Estado:</span>
                        <Badge variant="outline" className={`border-0 ${getStatusVariant(approval.status?.name)}`}>
                            {approval.status?.name || 'N/A'}
                        </Badge>
                    </div>

                    {/* Info */}
                    <div>
                        <h3 className="text-lg font-semibold">{approval.name}</h3>
                        <p className="text-gray-700 whitespace-pre-wrap mt-2 text-sm">{approval.description}</p>
                    </div>

                    {/* Approvers List */}
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">Aprobadores</h4>
                        <ul className="space-y-2">
                            {approval.approvers?.map((approver: any) => (
                                <li key={approver.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={approver.user?.image} alt={approver.user?.name} />
                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                                                    {approver.user?.name?.charAt(0) || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{approver.user?.name}</span>
                                        </div>
                                        <span className={`text-xs font-bold ${approver.status?.name === 'Aprobado' ? 'text-green-600' : (approver.status?.name === 'Rechazado' ? 'text-red-600' : 'text-gray-500')}`}>
                                            {approver.status?.name || 'Pendiente'}
                                        </span>
                                    </div>
                                    {approver.comment && (
                                        <div className="mt-2 text-gray-600 italic border-l-2 border-gray-300 pl-2">
                                            "{approver.comment}"
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Files */}
                    <div>
                        <ModelAttachments
                            modelId={approval.id}
                            modelType="App\Models\Approval"
                            initialFiles={approval.files || []}
                            readOnly={true}
                        />
                    </div>

                    {/* Comment Action */}
                    <div className="border-t pt-4">
                        <Label>Comentarios</Label>
                        {isActionDisabled ? (
                            <div className="mt-2 p-3 bg-gray-100 rounded text-gray-500 text-sm italic">
                                {isMainStatusFinal
                                    ? `Esta solicitud ya ha sido ${approval.status?.name?.toLowerCase()}.`
                                    : "Ya has respondido a esta solicitud."}
                            </div>
                        ) : (
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Agregue sus comentarios aquí..."
                                className="mt-2"
                            />
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {!isActionDisabled && (
                        <>
                            <Button
                                onClick={() => approveMutation.mutate()}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                                {approveMutation.isPending ? "Aprobando..." : "Aprobar"}
                            </Button>
                            <Button
                                onClick={() => rejectMutation.mutate()}
                                variant="destructive"
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                                {rejectMutation.isPending ? "Rechazando..." : "Rechazar"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
