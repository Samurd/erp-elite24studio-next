
import { Suspense } from "react";
import ClientsTable from "./components/ClientsTable";

export default function InvoicesClientsPage() {
    return (
        <div className="p-6">
            <Suspense fallback={<div>Cargando...</div>}>
                <ClientsTable />
            </Suspense>
        </div>
    );
}
