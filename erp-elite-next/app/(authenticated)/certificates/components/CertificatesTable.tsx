"use client"

import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, File as FileIcon } from "lucide-react"
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

interface Certificate {
    id: number
    name: string
    description?: string
    type?: { name: string }
    status?: { name: string, color?: string }
    assignedTo?: { name: string }
    issuedAt: string
    expiresAt: string
    filesCount?: number
    files?: any[]
}

interface CertificatesTableProps {
    data: Certificate[]
    onView: (cert: Certificate) => void
    onEdit: (cert: Certificate) => void
    onDelete: (cert: Certificate) => void
}

export default function CertificatesTable({ data, onView, onEdit, onDelete }: CertificatesTableProps) {

    // Status color helper - now using badge variants or inline styles similar to policies
    // We'll rely on the color from the status tag if available, similar to PoliciesPage logic

    const isExpired = (dateString: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        // Clear time part for accurate date comparison if needed, but simple comparison works for "Expired"
        return date < now;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>F. Emisión</TableHead>
                        <TableHead>F. Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Archivos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                No se encontraron certificados
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((cert) => (
                            <TableRow key={cert.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">#{cert.id}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium truncate max-w-[200px]" title={cert.name}>{cert.name}</span>
                                        {cert.description && (
                                            <span className="text-muted-foreground text-xs truncate max-w-[200px]" title={cert.description}>
                                                {cert.description}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {cert.type ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                            {cert.type.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {DateService.toDisplay(cert.issuedAt)}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <div className="flex flex-col">
                                        <span>{DateService.toDisplay(cert.expiresAt)}</span>
                                        {isExpired(cert.expiresAt) && (
                                            <span className="text-xs text-red-600 font-semibold">Vencido</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {cert.status ? (
                                        <Badge
                                            variant="secondary"
                                            style={{
                                                backgroundColor: cert.status.color ? cert.status.color + '20' : '#e5e7eb',
                                                color: cert.status.color || '#374151'
                                            }}
                                        >
                                            {cert.status.name}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {cert.assignedTo ? cert.assignedTo.name : '-'}
                                </TableCell>
                                <TableCell>
                                    {(cert.files && cert.files.length > 0) || (cert.filesCount && cert.filesCount > 0) ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 flex w-fit items-center gap-1">
                                            <FileIcon className="w-3 h-3" />
                                            {cert.filesCount || (cert.files ? cert.files.length : 0)}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => onView(cert)} title="Ver Detalles">
                                            <Eye className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(cert)} title="Editar">
                                            <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(cert)} title="Eliminar">
                                            <Trash2 className="h-4 w-4 text-red-600" />
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
