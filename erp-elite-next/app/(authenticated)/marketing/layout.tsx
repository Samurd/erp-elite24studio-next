import { ReactNode } from "react"
import MarketingSubmenu from "./components/MarketingSubmenu"

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <MarketingSubmenu />
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
