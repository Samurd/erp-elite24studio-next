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
import { Edit2, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { DateService } from "@/lib/date-service"

interface Vacancy {
    id: number
    title: string
    area?: string
    contractType?: { name: string }
    status?: { name: string }
    published_at?: string
    applicants_count?: number
}

interface VacanciesTableProps {
    data: Vacancy[]
    onDelete: (id: number) => void
    onEdit: (vacancy: Vacancy) => void
}

export function VacanciesTable({ data, onDelete, onEdit }: VacanciesTableProps) {
    if (!data.length) {
        return (
            <div className="text-center py-10 text-gray-500">
                No se encontraron vacantes.
            </div>
        )
    }

    return (
        <div className="bg-white rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Vacante</TableHead>
                        <TableHead>Contrato / Estado</TableHead>
                        <TableHead>Publicación</TableHead>
                        <TableHead>Postulantes</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((vacancy) => (
                        <TableRow key={vacancy.id}>
                            <TableCell>
                                <div className="font-medium text-gray-900">{vacancy.title}</div>
                                <div className="text-sm text-gray-500">{vacancy.area || '-'}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-gray-900 mb-1">{vacancy.contractType?.name || '-'}</div>
                                {vacancy.status && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                                        {vacancy.status.name}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {DateService.toDisplay(vacancy.published_at)}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center text-gray-600">
                                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                                    {vacancy.applicants_count || 0}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(vacancy)}
                                >
                                    <Edit2 className="h-4 w-4 text-indigo-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(vacancy.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
