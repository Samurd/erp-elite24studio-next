
"use client";

import { Suspense } from "react";
import BillingAccountsTable from "./components/BillingAccountsTable";

export default function BillingAccountsPage() {
    return (
        <div className="container mx-auto py-6">
            <Suspense fallback={<div>Cargando cuentas de cobro...</div>}>
                <BillingAccountsTable />
            </Suspense>
        </div>
    );
}
