import { ReactNode } from "react"
import DonationsSubmenu from "./components/DonationsSubmenu"

export default function DonationsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <DonationsSubmenu />
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
