"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FileText, Send, Receipt, Info } from "lucide-react";

export default function InvoicesPage() {
    return (
        <div className="p-6">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-800">Facturación</h1>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">REGISTRO DE FACTURAS-ELITE</h2>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p>ANTES DE INICIAR A REGISTRAR LA FACTURA DEBE SER EMITIDA POR LA DIAN, O SI ES CUENTA DE COBRO ASEGÚRESE QUE ESTÉ DESCARGADA CORRECTAMENTE.</p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Facturas a Clientes-DIAN */}
                <Link href="/finances/invoices/clients">
                    <Card className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                Facturación desde la DIAN para nuestros Clientes, Subir datos, ARCHIVOS
                            </p>

                            {/* Icon with gradient background */}
                            <div className="flex justify-center mb-4">
                                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-teal-400 to-green-500 flex items-center justify-center shadow-lg">
                                    <FileText className="w-20 h-20 text-white" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 text-center mb-3">
                                Facturas a Clientes-DIAN
                            </h3>

                            <div className="flex items-start gap-2 text-xs text-gray-500">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">CONTRATISTA: ELITE 24 STUDIO SAS</p>
                                    <p>CONTRATANTE: CLIENTE</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>

                {/* Card 2: Proveedores C. Cobro a Elite */}
                <Link href="/finances/invoices/providers">
                    <Card className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                Registrar las Cuentas de Cobro emitidas por Contratistas
                            </p>

                            {/* Icon with gradient background */}
                            <div className="flex justify-center mb-4">
                                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-pink-400 via-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Send className="w-20 h-20 text-white" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 text-center mb-3">
                                Proveedores C. Cobro a Elite
                            </h3>

                            <div className="flex items-start gap-2 text-xs text-gray-500">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">CONTRATISTA: PROVEEDOR</p>
                                    <p>CONTRATANTE: ELITE 24 STUDIO SAS</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>

                {/* Card 3: Cuentas de Cobro de ELITE */}
                <Link href="/finances/invoices/billing-accounts">
                    <Card className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer">
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 text-center">
                                Realizar y guardar las cuentas de Cobro emitidas por ELITE
                            </p>

                            {/* Icon with gradient background */}
                            <div className="flex justify-center mb-4">
                                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                                    <Receipt className="w-20 h-20 text-white" strokeWidth={1.5} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 text-center mb-3">
                                Cuentas de Cobro de ELITE
                            </h3>

                            <div className="flex items-start gap-2 text-xs text-gray-500">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">CONTRATISTA: ELITE 24 STUDIO SAS</p>
                                    <p>CONTRATANTE: CLIENTE</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
