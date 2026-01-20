
import MoneyDisplay from "@/components/ui/money-display";
import { Badge } from "@/components/ui/badge";
import ModelAttachments from "@/components/cloud/ModelAttachments";
import { DateService } from "@/lib/date-service";

export default function ProviderDetails({ invoice }: { invoice: any }) {

    if (!invoice) return <div className="p-6">No encontrado</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Información General</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Proveedor</label>
                                <p className="text-lg text-gray-900 font-medium">{invoice.contact?.name || "N/A"}</p>
                                {invoice.contact?.company && (
                                    <p className="text-sm text-gray-500">{invoice.contact.company}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Fecha de Factura</label>
                                <p className="text-lg text-gray-900">
                                    {invoice.invoiceDate ? DateService.toDisplay(invoice.invoiceDate) : "N/A"}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Estado</label>
                                <div className="mt-1">
                                    {invoice.status ? (
                                        <Badge variant="secondary" className="text-base px-3 py-1 bg-blue-100 text-blue-800">
                                            {invoice.status.name}
                                        </Badge>
                                    ) : "N/A"}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Creado Por</label>
                                <p className="text-gray-900">{invoice.createdByName || "Sistema"}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-500">Descripción</label>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mt-2 whitespace-pre-wrap">
                                {invoice.description || "Sin descripción"}
                            </p>
                        </div>
                    </div>

                    {/* Files */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Archivos Adjuntos</h3>
                        <ModelAttachments
                            initialFiles={invoice?.files || []}
                            modelId={invoice.id}
                            modelType="App\Models\Invoice"
                        />
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6 border">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detalles Financieros</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Monto Total</label>
                                <div className="text-3xl font-bold text-yellow-600 mt-1">
                                    <MoneyDisplay value={invoice.total || 0} />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                                <p className="text-gray-900 font-medium">{invoice.methodPayment || "No especificado"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
