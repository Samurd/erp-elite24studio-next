"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function RrhhSubmenu() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        // Special handle for Reclutamiento which covers vacancies and applicants
        if (path === "/rrhh/vacancies" && pathname.startsWith("/rrhh/applicants")) {
            return true
        }
        return pathname.startsWith(path)
    }

    const links = [
        {
            href: "/rrhh/contracts",
            label: "Contratos",
            match: "/rrhh/contracts"
        },
        {
            href: "/rrhh/employees",
            label: "Empleados",
            match: "/rrhh/employees"
        },
        {
            href: "/rrhh/vacancies",
            label: "Reclutamiento",
            match: "/rrhh/vacancies"
        },
        {
            href: "/rrhh/interviews",
            label: "Entrevistas",
            match: "/rrhh/interviews"
        },
        {
            href: "/rrhh/interviews/calendar",
            label: "Calendario Entrevistas",
            match: "/rrhh/interviews/calendar"
        },
        {
            href: "/rrhh/inductions",
            label: "Inducciones",
            match: "/rrhh/inductions"
        },
        {
            href: "/rrhh/kits",
            label: "Kits Bienvenida",
            match: "/rrhh/kits"
        },
        {
            href: "/rrhh/birthdays",
            label: "Cumpleaños",
            match: "/rrhh/birthdays"
        },
        {
            href: "/rrhh/offboardings",
            label: "Off-boarding",
            match: "/rrhh/offboardings"
        },
        {
            href: "/rrhh/holidays",
            label: "Vacaciones/Permisos med.",
            match: "/rrhh/holidays"
        },
        {
            href: "/rrhh/attendances",
            label: "Asistencia",
            match: "/rrhh/attendances"
        }
    ]

    return (
        <div className="w-[90%] bg-white border-b shadow-xs h-12 flex items-center relative rounded-full m-4">
            <div id="scrollContainer" className="flex-1 overflow-x-auto whitespace-nowrap flex items-center scrollbar-hide scroll-smooth no-scrollbar">
                <ul className="flex items-center space-x-6 text-sm font-medium px-4 mx-auto">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    "transition-colors duration-200",
                                    isActive(link.match)
                                        ? "text-purple-600 font-semibold"
                                        : "hover:text-purple-600 text-gray-600 font-medium"
                                )}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
