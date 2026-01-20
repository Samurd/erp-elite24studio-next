
import { Suspense } from "react";
import ProvidersTable from "./components/ProvidersTable";

export default function InvoicesProvidersPage() {
    return (
        <div className="p-6">
            <Suspense fallback={<div>Cargando...</div>}>
                <ProvidersTable />
            </Suspense>
        </div>
    );
}
