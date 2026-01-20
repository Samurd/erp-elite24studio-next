
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Calendar, FileText } from "lucide-react"
import { DateService } from "@/lib/date-service"

interface Interview {
    id: number
    applicant: { fullName: string; email: string }
    date: string
    time: string
    interviewer: { name: string }
    interviewType: { name: string }
    status: { name: string }
    result: { name: string } | null
}

interface InterviewsTableProps {
    data: Interview[]
    onEdit: (interview: Interview) => void
    onDelete: (id: number) => void
}

export function InterviewsTable({ data, onEdit, onDelete }: InterviewsTableProps) {
    if (!data.length) {
        return <div className="text-center py-10 text-gray-500">No se encontraron entrevistas.</div>
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Postulante</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Entrevistador</TableHead>
                        <TableHead>Tipo / Estado</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                            <TableCell>
                                <div className="font-medium text-gray-900">{item.applicant?.fullName}</div>
                                <div className="text-sm text-gray-500">{item.applicant?.email}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {DateService.toDisplay(item.date)}</span>
                                    {item.time && <span>{item.time.substring(0, 5)}</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {item.interviewer?.name || 'Sin asignar'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-gray-500">{item.interviewType?.name}</span>
                                    <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200">
                                        {item.status?.name}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                {item.result ? (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                        {item.result.name}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Pendiente</span>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(item)}
                                    className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 mr-1"
                                    title="Editar"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(item.id)}
                                    className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                    title="Eliminar"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
