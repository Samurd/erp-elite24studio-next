import { ReactNode } from "react"
import RrhhSubmenu from "./components/RrhhSubmenu"

export default function RrhhLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <RrhhSubmenu />
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
