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
import { Pencil, Trash2, Eye } from "lucide-react"
import { DateService } from "@/lib/date-service"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"
import MoneyDisplay from "@/components/ui/money-display"

interface PayrollsTableProps {
    data: any[]
    meta: any
    onPageChange: (page: number) => void
    onEdit: (item: any) => void
    onDelete: (id: number) => void
    onView: (item: any) => void
    isLoading?: boolean
}

export function PayrollsTable({ data, meta, onPageChange, onEdit, onDelete, onView, isLoading }: PayrollsTableProps) {
    if (isLoading) {
        return <div className="text-center py-10">Cargando nóminas...</div>
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-gray-200">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-black to-yellow-600">
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="text-white font-semibold uppercase w-[80px]">ID</TableHead>
                            <TableHead className="text-white font-semibold uppercase">Empleado</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Estado</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Subtotal</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Bonos</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Deducciones</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Total</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Fecha</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50 text-gray-800">
                                <TableCell className="p-2 font-mono text-xs text-gray-500">#{item.id}</TableCell>
                                <TableCell className="p-2">
                                    <div className="font-medium text-gray-900">{item.employee?.fullName || 'Sin empleado'}</div>
                                </TableCell>
                                <TableCell className="text-center p-2">
                                    {item.status ? (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {item.status.name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center p-2 text-sm">
                                    <MoneyDisplay value={item.subtotal} />
                                </TableCell>
                                <TableCell className="text-center p-2 text-sm text-green-600">
                                    <MoneyDisplay value={item.bonos || 0} />
                                </TableCell>
                                <TableCell className="text-center p-2 text-sm text-red-600">
                                    <MoneyDisplay value={item.deductions || 0} />
                                </TableCell>
                                <TableCell className="text-center p-2 font-medium text-sm">
                                    <MoneyDisplay value={item.total} />
                                </TableCell>
                                <TableCell className="text-center p-2">{DateService.toDisplay(item.createdAt)}</TableCell>
                                <TableCell className="text-center p-2">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => onView(item)} className="h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold text-xs">
                                            <Eye className="h-4 w-4 mr-1" /> Ver
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold text-xs">
                                            <Pencil className="h-4 w-4 mr-1" /> Editar
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50 font-semibold text-xs">
                                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                                    No se encontraron nóminas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (meta.current_page > 1) onPageChange(meta.current_page - 1); }}
                                className={`gap-1 pl-2.5 ${meta.current_page <= 1 ? "pointer-events-none opacity-50 text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
                                size="default"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Anterior</span>
                            </PaginationLink>
                        </PaginationItem>

                        {Array.from({ length: meta.last_page }).map((_, i) => (
                            <PaginationItem key={i}>
                                <PaginationLink
                                    href="#"
                                    isActive={meta.current_page === i + 1}
                                    onClick={(e) => { e.preventDefault(); onPageChange(i + 1); }}
                                    className={meta.current_page === i + 1 ? "bg-yellow-600 text-white hover:bg-yellow-700 hover:text-white" : "text-gray-600 hover:bg-gray-100"}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (meta.current_page < meta.last_page) onPageChange(meta.current_page + 1); }}
                                className={`gap-1 pr-2.5 ${meta.current_page >= meta.last_page ? "pointer-events-none opacity-50 text-gray-400" : "text-gray-600 hover:bg-gray-100"}`}
                                size="default"
                            >
                                <span>Siguiente</span>
                                <ChevronRight className="h-4 w-4" />
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}

import { ChevronLeft, ChevronRight } from "lucide-react"

