"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    permissions: Record<string, boolean>; // or string[] depending on how permissions are passed. The vue code used an object access permissions.finanzas
}

export default function Sidebar({ permissions }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname.startsWith(path);
    };

    const linkClasses = (path: string) =>
        `flex gap-2 items-center px-3 py-3 font-medium rounded-xl text-gray-400 hover:text-white ${isActive(path)
            ? "bg-gradient-to-r from-black to-yellow-600 text-white"
            : "hover:bg-gray-700"
        }`;

    // Sub-items style adjustment (smaller padding/text logic from Vue)
    // Vue used: py-2 px-1 ... and text-[0.65rem] for descriptions
    const itemClasses = (path: string) =>
        `flex gap-2 items-center py-2 px-1 rounded-xl text-gray-400 hover:text-white ${isActive(path)
            ? "bg-gradient-to-r from-black to-yellow-600 text-white"
            : "hover:bg-gray-700"
        }`;

    return (
        <aside className="fixed top-0 left-0 z-30 h-screen w-[280px] bg-[#252525] shadow-md flex flex-col">
            <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Encabezado */}
                <div className="p-6 text-xl font-bold text-white flex justify-between items-center">
                    <div>
                        <span className="text-center text-xl">Studio Hub</span>
                    </div>
                </div>

                {/* Contenido Scrollable */}
                <nav className="flex flex-col flex-1 mt-4 space-y-1 pb-6 px-2">
                    {/* Dashboard */}
                    <Link
                        href="/dashboard"
                        className={linkClasses("/dashboard")}
                    >
                        <i className="fas fa-tachometer-alt w-6 h-6 text-xl"></i>
                        Panel-Dashboard
                    </Link>

                    {permissions.finanzas && (
                        <Link href="/finances" className={itemClasses("/finances")}>
                            <i className="fas fa-chart-line w-7 h-7 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Finanzas</span>
                                <span className="text-[0.65rem] ">Contabilidad Empresarial -Ventas - Gastos</span>
                            </span>
                        </Link>
                    )}

                    {permissions.contactos && (
                        <Link href="/contacts" className={itemClasses("/contacts")}>
                            <i className="fas fa-database w-7 h-7 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Base de datos</span>
                                <span className="text-[0.65rem] ">CRM Clientes-Alianzas-Partners-Empleados</span>
                            </span>
                        </Link>
                    )}

                    {permissions.aprobaciones && (
                        <Link href="/approvals" className={itemClasses("/approvals")}>
                            <i className="fas fa-check-circle w-7 h-7 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Aprobaciones</span>
                                <span className="text-[0.65rem] ">Tareas- Solicitudes Revision</span>
                            </span>
                        </Link>
                    )}

                    {permissions.donaciones && (
                        <Link href="/donations/campaigns" className={itemClasses("/donations")}>
                            <i className="fas fa-hand-holding-heart w-7 h-7 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Donaciones</span>
                                <span className="text-[0.65rem] ">Fundaciones Aliadas</span>
                            </span>
                        </Link>
                    )}

                    {permissions["registro-casos"] && (
                        <Link href="/case-records" className={itemClasses("/case-record")}>
                            <i className="fas fa-headset w-6 h-7 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Registro-Casos</span>
                                <span className="text-[0.65rem] ">Registros Casos Comerciales</span>
                            </span>
                        </Link>
                    )}

                    {permissions.reportes && (
                        <Link href="/reports" className={itemClasses("/reports")}>
                            <i className="fas fa-file-contract w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Reportes</span>
                                <span className="text-[0.65rem] ">Notificaciones</span>
                            </span>
                        </Link>
                    )}

                    {permissions.cotizaciones && (
                        <Link href="/quotes" className={itemClasses("/quotes")}>
                            <i className="fas fa-calculator w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Cotizaciones</span>
                                <span className="text-[0.65rem] ">Presupuestos</span>
                            </span>
                        </Link>
                    )}

                    {permissions.suscripciones && (
                        <Link href="/subscriptions" className={itemClasses("/subscriptions")}>
                            <i className="fas fa-shopping-bag w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Suscripciones</span>
                                <span className="text-[0.65rem] ">Todos los Gastos Fijos</span>
                            </span>
                        </Link>
                    )}

                    {permissions.rrhh && (
                        <Link href="/rrhh/contracts" className={itemClasses("/rrhh")}>
                            <i className="fas fa-users w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">RR.HH/ Contratos</span>
                                <span className="text-[0.65rem] ">Reclutamiento, Base de Datos empleados</span>
                            </span>
                        </Link>
                    )}

                    {permissions.politicas && (
                        <Link href="/policies" className={itemClasses("/policies")}>
                            <i className="fas fa-file-alt w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Politicas</span>
                                <span className="text-[0.65rem] ">Empresariales- Equipos</span>
                            </span>
                        </Link>
                    )}

                    {permissions.certificados && (
                        <Link href="/certificates" className={itemClasses("/certificates")}>
                            <i className="fas fa-certificate w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Certificados</span>
                                <span className="text-[0.65rem] ">Empresariales- Bancarios</span>
                            </span>
                        </Link>
                    )}

                    {permissions.licencias && (
                        <Link href="/licenses" className={itemClasses("/licenses")}>
                            <i className="fas fa-file-signature w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Tramites y Licencias</span>
                                <span className="text-[0.65rem] ">Gestion documental de licencias para construcción</span>
                            </span>
                        </Link>
                    )}

                    {permissions.proyectos && (
                        <Link href="/projects" className={itemClasses("/projects")}>
                            <i className="fas fa-project-diagram w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Proyectos</span>
                                <span className="text-[0.65rem] ">Todas las Categorias</span>
                            </span>
                        </Link>
                    )}

                    {permissions.obras && (
                        <Link href="/worksites" className={itemClasses("/worksites")}>
                            <i className="fas fa-hard-hat w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Obras Construcción</span>
                                <span className="text-[0.65rem] ">Gestion en Obra ELITE 24</span>
                            </span>
                        </Link>
                    )}

                    {permissions.kpis && (
                        <Link href="/kpis" className={itemClasses("/kpis")}>
                            <i className="fas fa-tasks w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">KPIS/Control calidad</span>
                                <span className="text-[0.65rem] ">Indicaroes KPIS-Indicador clave de rendimiento</span>
                            </span>
                        </Link>
                    )}

                    {permissions.marketing && (
                        <Link href="/marketing/strategies" className={itemClasses("/marketing")}>
                            <i className="fas fa-bullhorn w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Marketing Elite</span>
                                <span className="text-[0.65rem] ">Estrategias, Gestion, Registros- Novedades</span>
                            </span>
                        </Link>
                    )}

                    <Link href="/planner" className={itemClasses("/planner")}>
                        <i className="fas fa-clipboard-list w-8 text-xl"></i>
                        <span className="flex flex-col">
                            <span className="">Planner Task</span>
                        </span>
                    </Link>

                    <Link href="/calendar" className={itemClasses("/calendar")}>
                        <i className="fas fa-calendar-alt w-8 text-xl"></i>
                        <span className="flex flex-col">
                            <span className="">Agenda Personal</span>
                            <span className="text-[0.65rem] ">Eventos-recordatorios</span>
                        </span>
                    </Link>

                    {permissions.cloud && (
                        <Link href="/cloud" className={itemClasses("/cloud")}>
                            <i className="fas fa-cloud w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Cloud</span>
                                <span className="text-[0.65rem] ">Documents</span>
                            </span>
                        </Link>
                    )}

                    {permissions.reuniones && (
                        <Link href="/meetings" className={itemClasses("/meetings")}>
                            <i className="fas fa-video w-8 text-xl"></i>
                            <span className="flex flex-col">
                                <span className="">Reuniones</span>
                            </span>
                        </Link>
                    )}
                </nav>
            </div>
        </aside>
    );
}
