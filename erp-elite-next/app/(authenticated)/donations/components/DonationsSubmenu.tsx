"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DonationsSubmenu() {
    const pathname = usePathname()

    const isActive = (path: string) => {
        return pathname.startsWith(path)
    }

    const links = [
        {
            href: "/donations/campaigns",
            label: "Campañas",
            match: "/donations/campaigns"
        },
        {
            href: "/donations/donations",
            label: "Donaciones",
            match: "/donations/donations"
        },
        // {
        //     href: "/donations/calendar",
        //     label: "Calendario",
        //     match: "/donations/calendar"
        // },
        {
            href: "/donations/volunteers",
            label: "Voluntariado",
            match: "/donations/volunteers"
        },
        {
            href: "/donations/alliances",
            label: "Alianzas/Convenios",
            match: "/donations/alliances"
        },
        {
            href: "/donations/apu-campaigns",
            label: "Control Presupuestos APU",
            match: "/donations/apu-campaigns"
        }
    ]

    return (
        <div className="w-min bg-white border-b shadow-xs h-12 flex items-center relative rounded-full m-4">
            <div id="scrollContainer" className="flex-1 overflow-x-auto whitespace-nowrap flex items-center scrollbar-hide scroll-smooth no-scrollbar">
                <ul className="flex items-center space-x-6 text-sm font-medium px-4">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    "transition-colors duration-200",
                                    isActive(link.match)
                                        ? "text-yellow-600 font-semibold"
                                        : "hover:text-yellow-600 text-gray-600"
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
