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
import { Edit2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Applicant {
    id: number
    full_name: string
    email?: string
    vacancy?: { title: string }
    status?: { name: string }
    created_at?: string
}

interface ApplicantsTableProps {
    data: Applicant[]
    onDelete?: (id: number) => void
    onEdit: (applicant: Applicant) => void
}

export function ApplicantsTable({ data, onEdit }: ApplicantsTableProps) {
    if (!data.length) {
        return (
            <div className="text-center py-10 text-gray-500">
                No se encontraron postulantes.
            </div>
        )
    }

    return (
        <div className="bg-white rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Postulante</TableHead>
                        <TableHead>Vacante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((applicant) => (
                        <TableRow key={applicant.id}>
                            <TableCell>
                                <div className="font-medium text-gray-900">{applicant.full_name}</div>
                                <div className="text-sm text-primary hover:underline">
                                    <a href={`mailto:${applicant.email}`}>{applicant.email}</a>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm text-gray-900">{applicant.vacancy?.title || '-'}</div>
                            </TableCell>
                            <TableCell>
                                {applicant.status && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                                        {applicant.status.name}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                                {applicant.created_at ? format(new Date(applicant.created_at), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(applicant)}
                                >
                                    <Edit2 className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
