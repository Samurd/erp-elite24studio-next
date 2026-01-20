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
    ExternalLink,
    Calendar,
    Clock
} from "lucide-react"

interface MeetingsTableProps {
    data: any[]
    onView: (meeting: any) => void
    onEdit: (meeting: any) => void
    onDelete: (id: number) => void
}

import { DateService } from "@/lib/date-service"

// ... imports ...

export default function MeetingsTable({ data, onView, onEdit, onDelete }: MeetingsTableProps) {

    // Helpers
    const formatDate = (dateString: string) => {
        return DateService.toDisplay(dateString)
    }

    const formatTime = (timeString: string) => {
        if (!timeString) return ''
        return timeString.substring(0, 5)
    }

    const getStatusColor = (statusName: string = '') => {
        switch (statusName) {
            case 'Programada': return 'bg-blue-100 text-blue-800'
            case 'Realizada': return 'bg-green-100 text-green-800'
            case 'Cancelada': return 'bg-red-100 text-red-800'
            case 'Postergada': return 'bg-yellow-100 text-yellow-800'
            case 'En Progreso': return 'bg-purple-100 text-purple-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="bg-white rounded-md border shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Meta</TableHead>
                        <TableHead>Responsables</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center h-24 text-gray-500">
                                No se encontraron reuniones
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((meeting) => (
                            <TableRow key={meeting.id}>
                                <TableCell className="font-medium">#{meeting.id}</TableCell>
                                <TableCell>
                                    <div className="font-medium text-gray-900">{meeting.title}</div>
                                    {meeting.notes && (
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]" title={meeting.notes}>
                                            {meeting.notes}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(meeting.date)}
                                    </div>

                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            {formatTime(meeting.startTime)}
                                            {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{meeting.team?.name || '-'}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(meeting.status?.name)}`}>
                                        {meeting.status?.name || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {meeting.url ? (
                                        <a href={meeting.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Link
                                        </a>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={meeting.goal === 1 ? 'default' : 'secondary'} className={meeting.goal === 1 ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                        {meeting.goal === 1 ? 'Sí' : 'No'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {meeting.responsibles && meeting.responsibles.length > 0 ? (
                                            meeting.responsibles.map((resp: any) => (
                                                <Badge key={resp.id} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                    {resp.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onView(meeting)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onEdit(meeting)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(meeting.id)}>
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
