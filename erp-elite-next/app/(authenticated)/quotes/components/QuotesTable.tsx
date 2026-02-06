"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Eye,
    Pencil,
    Trash2,
    Paperclip,
    Calendar,
    DollarSign
} from "lucide-react"
import MoneyDisplay from "@/components/ui/money-display"
import { DateService } from "@/lib/date-service"

interface QuotesTableProps {
    data: any[]
    onView: (quote: any) => void
    onEdit: (quote: any) => void
    onDelete: (id: number) => void
}

export default function QuotesTable({ data, onView, onEdit, onDelete }: QuotesTableProps) {

    // Helpers
    const formatDate = (dateString: string) => {
        return DateService.toDisplay(dateString)
    }

    const getStatusColor = (statusName: string = '') => {
        // Adapt colors based on status names commonly used in quotes
        switch (statusName.toLowerCase()) {
            case 'aprobada': return 'bg-green-100 text-green-800'
            case 'rechazada': return 'bg-red-100 text-red-800'
            case 'pendiente': return 'bg-yellow-100 text-yellow-800'
            case 'enviada': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="bg-white rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Fecha Emisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-gray-500">
                                No se encontraron cotizaciones
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((quote) => (
                            <TableRow key={quote.id}>
                                <TableCell className="font-medium">#{quote.id}</TableCell>
                                <TableCell className="font-medium text-gray-900">
                                    {quote.contact?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(quote.issuedAt)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(quote.status?.name)}`}>
                                        {quote.status?.name || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 font-medium">
                                        <MoneyDisplay value={Number(quote.total) * 100} />
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(quote)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEdit(quote)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(quote.id)}>
                                            <Trash2 className="w-4 h-4" />
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
