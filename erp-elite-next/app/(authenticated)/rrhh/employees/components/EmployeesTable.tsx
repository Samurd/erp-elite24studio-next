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

interface EmployeesTableProps {
    employees: any[]
    onDelete?: (id: number) => void
}

export function EmployeesTable({ employees, onDelete }: EmployeesTableProps) {
    if (employees.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-white">
                No se encontraron empleados.
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead>Empleado</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Cargo / Dept</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => (
                        <TableRow key={employee.id}>
                            <TableCell>
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-sm uppercase mr-3">
                                        {employee.fullName?.substring(0, 2)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{employee.fullName}</span>
                                        <span className="text-xs text-muted-foreground">{employee.identificationNumber}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-900">{employee.workEmail}</span>
                                    <span className="text-xs text-muted-foreground">{employee.mobilePhone}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-900">{employee.jobTitle}</span>
                                    <span className="text-xs text-muted-foreground">{employee.department?.name || '-'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                    Activo
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                        <Link href={`/rrhh/employees/${employee.id}?edit=true`}>
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(employee.id)}
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
