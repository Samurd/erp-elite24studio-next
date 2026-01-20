"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash } from "lucide-react"
import Link from "next/link"

import { DateService } from "@/lib/date-service"

interface ContractsTableProps {
    contracts: any[]
    onEdit?: (contract: any) => void
    onView?: (contract: any) => void
    onDelete?: (id: number) => void
}

export function ContractsTable({ contracts, onEdit, onView, onDelete }: ContractsTableProps) {
    const formatDate = (dateString?: string) => {
        return DateService.toDisplayDate(dateString);
    };

    const getStatusVariant = (statusName?: string) => {
        if (!statusName) return "secondary";
        const name = statusName.toLowerCase();
        if (name.includes('activo') || name.includes('vigente')) return "default"; // green-ish in default theme usually, or customize
        if (name.includes('inactivo') || name.includes('terminado')) return "destructive";
        return "secondary";
    }

    // Custom badge colors map if needed for specific Shadcn theme
    const getBadgeClass = (statusName?: string) => {
        if (!statusName) return "bg-gray-100 text-gray-800 hover:bg-gray-100";
        const name = statusName.toLowerCase();
        if (name.includes('activo') || name.includes('vigente')) return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
        if (name.includes('inactivo') || name.includes('terminado')) return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }

    if (contracts.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-white">
                No se encontraron contratos.
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Empleado</TableHead>
                        <TableHead>Tipo / Categoría</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Fin</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contracts.map((contract) => (
                        <TableRow key={contract.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{contract.employee?.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{contract.employee?.identificationNumber}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{contract.type?.name || '-'}</span>
                                    <span className="text-xs text-muted-foreground">{contract.category?.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={getBadgeClass(contract.status?.name)}>
                                    {contract.status?.name}
                                </Badge>
                            </TableCell>
                            <TableCell>{formatDate(contract.startDate)}</TableCell>
                            <TableCell>{formatDate(contract.endDate)}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onView?.(contract)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit?.(contract)}
                                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(contract.id)}
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
