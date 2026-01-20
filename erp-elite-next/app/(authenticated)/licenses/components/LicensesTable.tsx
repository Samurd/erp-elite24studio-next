import { DateService } from "@/lib/date-service"
import { FileIcon, Trash2, Edit, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface LicensesTableProps {
    licenses: any[]
    onEdit: (license: any) => void
    onDelete: (license: any) => void
}

export default function LicensesTable({ licenses, onEdit, onDelete }: LicensesTableProps) {

    // Status color helper similar to the Vue version
    const getStatusColor = (statusName: string) => {
        switch (statusName) {
            case 'Aprobada': return 'text-green-800 bg-green-100';
            case 'En Trámite': return 'text-yellow-800 bg-yellow-100';
            case 'Rechazada': return 'text-red-800 bg-red-100';
            case 'En Revisión': return 'text-blue-800 bg-blue-100';
            case 'Observada': return 'text-purple-800 bg-purple-100';
            case 'Vencida': return 'text-gray-800 bg-gray-100';
            case 'Prorrogada': return 'text-teal-800 bg-teal-100';
            default: return 'text-gray-800 bg-gray-100';
        }
    };

    const isExpired = (dateString: string | null) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const now = new Date();
        return date < now;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Entidad</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Núm. Erradicado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>F. Vencimiento</TableHead>
                        <TableHead>Prórroga</TableHead>
                        <TableHead>Archivos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {licenses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={11} className="text-center py-6 text-muted-foreground">
                                No se encontraron licencias
                            </TableCell>
                        </TableRow>
                    ) : (
                        licenses.map((license) => (
                            <TableRow key={license.id}>
                                <TableCell className="font-medium">#{license.id}</TableCell>
                                <TableCell>{license.project ? license.project.name : '-'}</TableCell>
                                <TableCell>{license.entity || '-'}</TableCell>
                                <TableCell>{license.company || '-'}</TableCell>
                                <TableCell>{license.eradicatedNumber || '-'}</TableCell>
                                <TableCell>
                                    {license.licenseType ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                            {license.licenseType.name}
                                        </Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {license.status ? (
                                        <Badge
                                            variant="outline"
                                            className={`${getStatusColor(license.status.name)} border-0`}
                                        >
                                            {license.status.name}
                                        </Badge>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{DateService.toDisplay(license.expirationDate)}</span>
                                        {isExpired(license.expirationDate) && (
                                            <span className="text-xs text-red-600 font-medium">Vencida</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {license.requiresExtension === 1 ? (
                                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                                            Sí
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-500 border-gray-200">
                                            No
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {(license.filesCount || (license.files ? license.files.length : 0)) > 0 ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 flex w-fit items-center gap-1">
                                            <FileIcon className="w-3 h-3" />
                                            {license.filesCount || (license.files ? license.files.length : 0)}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                                            onClick={() => onEdit(license)}
                                        >
                                            <Edit className="w-4 h-4 mr-1" /> Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                                            onClick={() => onDelete(license)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
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
