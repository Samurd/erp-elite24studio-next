"use client"

import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DateService } from "@/lib/date-service"
import MoneyDisplay from "@/components/ui/money-display"

interface GrossIncome {
    id: number
    name: string
    description?: string
    amount: number
    date: string
    category?: { name: string }
    result?: { name: string }
    createdBy?: { name: string, image?: string }
}

interface GrossIncomeTableProps {
    data: GrossIncome[]
    onEdit: (item: GrossIncome) => void
    onDelete: (item: GrossIncome) => void
}

export default function GrossIncomeTable({ data, onEdit, onDelete }: GrossIncomeTableProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-gradient-to-r from-black to-yellow-600 text-white uppercase font-semibold">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-white">Descripción</TableHead>
                        <TableHead className="text-center text-white">Fecha</TableHead>
                        <TableHead className="text-center text-white">Monto</TableHead>
                        <TableHead className="text-center text-white">Resultado</TableHead>
                        <TableHead className="text-center text-white">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No hay ingresos registrados
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id} className="hover:bg-gray-50">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{item.name}</span>
                                        {item.description && (
                                            <span className="text-xs text-gray-500 truncate max-w-[300px]" title={item.description}>
                                                {item.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center text-sm text-gray-600">
                                    {DateService.toDisplay(item.date)}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-green-600">
                                    <MoneyDisplay value={item.amount} />
                                </TableCell>
                                <TableCell className="text-center">
                                    {item.result ? (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                                            {item.result.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 h-8"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8"
                                            onClick={() => onDelete(item)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                                        </Button>
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
