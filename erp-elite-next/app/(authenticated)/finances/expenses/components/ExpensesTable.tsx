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
import { Pencil, Trash2, Paperclip } from "lucide-react"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import MoneyDisplay from "@/components/ui/money-display"
import { DateService } from "@/lib/date-service"

interface ExpensesTableProps {
    data: any[]
    meta: any
    onPageChange: (page: number) => void
    onEdit: (item: any) => void
    onDelete: (id: number) => void
    isLoading: boolean
}

export default function ExpensesTable({ data, meta, onPageChange, onEdit, onDelete, isLoading }: ExpensesTableProps) {

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500">Cargando egresos...</div>
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-gray-200">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-black to-yellow-600">
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="text-white font-semibold uppercase">Descripción</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Fecha</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Monto</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Resultado</TableHead>
                            <TableHead className="text-white font-semibold uppercase text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50 text-gray-800">
                                <TableCell className="p-2">
                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                        {item.name}
                                        {item.files && item.files.length > 0 && (
                                            <Paperclip className="h-3 w-3 text-blue-500" />
                                        )}
                                    </div>
                                    {item.description && (
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>
                                    )}
                                    <div className="text-xs text-blue-500 mt-1">{item.category?.name}</div>
                                </TableCell>
                                <TableCell className="text-center p-2">{DateService.toDisplay(item.date)}</TableCell>
                                <TableCell className="text-center p-2">
                                    <MoneyDisplay value={item.amount} className="font-bold text-red-600" />
                                </TableCell>
                                <TableCell className="text-center p-2">
                                    <span className="bg-gray-100 text-xs px-2 py-1 rounded text-gray-700">
                                        {item.result?.name || "-"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center p-2">
                                    <div className="flex justify-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 font-semibold text-xs">
                                            Editar
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50 font-semibold text-xs">
                                            Eliminar
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                    No se encontraron egresos.
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
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (meta.current_page > 1) onPageChange(meta.current_page - 1); }}
                                className={meta.current_page <= 1 ? "pointer-events-none opacity-50 text-gray-400" : "text-gray-600 hover:bg-gray-100"}
                            />
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
                            <PaginationNext
                                href="#"
                                onClick={(e) => { e.preventDefault(); if (meta.current_page < meta.last_page) onPageChange(meta.current_page + 1); }}
                                className={meta.current_page >= meta.last_page ? "pointer-events-none opacity-50 text-gray-400" : "text-gray-600 hover:bg-gray-100"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    )
}
