"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { DateService } from "@/lib/date-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ApprovalTableProps {
    approvals: any[]
    isSent?: boolean
    onView: (id: number) => void
    onEdit?: (approval: any) => void
    onDelete?: (id: number) => void
}

export default function ApprovalTable({ approvals, isSent = false, onView, onEdit, onDelete }: ApprovalTableProps) {

    const getPriorityIcon = (name: string) => {
        if (name === 'Alta') return <AlertCircle className="h-5 w-5 text-red-500" />
        if (name === 'Media') return <AlertTriangle className="h-5 w-5 text-yellow-500" />
        return <CheckCircle className="h-5 w-5 text-green-500" />
    }

    const getStatusVariant = (name: string) => {
        if (name === 'Aprobado') return 'bg-green-100 text-green-800 hover:bg-green-200'
        if (name === 'Rechazado') return 'bg-red-100 text-red-800 hover:bg-red-200'
        if (name === 'En espera') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        return 'secondary'
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
            <Table>
                <TableHeader className="bg-gray-50">
                    <TableRow>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Título de la solicitud</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead>Enviado por</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {approvals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay resultados</TableCell>
                        </TableRow>
                    ) : (
                        approvals.map((approval) => (
                            <TableRow key={approval.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <div title={approval.priority?.name}>
                                        {getPriorityIcon(approval.priority?.name)}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{approval.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`border-0 ${getStatusVariant(approval.status?.name)}`}>
                                        {approval.status?.name || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                        {approval.buy ? 'Solicitud de Compra' : 'Aprobación'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {DateService.toDisplay(approval.createdAt, 'dd/MM/yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={approval.creator?.image} alt={approval.creator?.name} />
                                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-bold">
                                                {approval.creator?.name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{approval.creator?.name || 'N/A'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onView(approval.id)} title="Ver Detalles">
                                            <Eye className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        {isSent && onEdit && (
                                            <Button variant="ghost" size="icon" onClick={() => onEdit(approval)} title="Editar">
                                                <Pencil className="h-4 w-4 text-yellow-600" />
                                            </Button>
                                        )}
                                        {isSent && onDelete && (
                                            <Button variant="ghost" size="icon" onClick={() => onDelete(approval.id)} title="Eliminar">
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
