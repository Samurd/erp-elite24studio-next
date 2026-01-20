import { db } from "@/lib/db";
import { tags, tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedTags() {
    console.log("🌱 Seeding Tags...");

    const tagsData: Record<string, { name: string; slug?: string; color?: string }[]> = {
        // Resultado ingreso
        "resultado_ingreso": [
            { name: "Realizado" },
            { name: "Pendiente" },
            { name: "Rechazado" },
        ],
        "categoria_ingreso": [
            { name: "LEED y EDGE" },
            { name: "Diseño Arq.Ejecutivo" },
            { name: "Interiorismo" },
            { name: "Inmobiliaria" },
            { name: "Ejecucion de obra" },
            { name: "Arquitectura espacial" },
        ],
        "tipo_ingreso": [
            { name: "Venta de Servicios/Productos" },
            { name: "Adicionales de Obra" },
            {
                name:
                    "Otros (como alquileres, licencias, regalos, etc.)",
            },
        ],
        "categoria_gasto": [
            { name: "Costos Directos" },
            { name: "Gastos Indirectos" },
            {
                name: "Impuestos",
            },
            {
                name: "Gastos Financieros",
            },
        ],
        "estado_factura": [
            { name: "Pagado", color: "#10B981" },
            { name: "Pendiente", color: "#F59E0B" },
            { name: "Vencido", color: "#EF4444" },
            { name: "Anulado", color: "#6B7280" },
        ],
        "estado_nomina": [
            { name: "Pagado", color: "#10B981" },
            { name: "Pendiente", color: "#F59E0B" },
            { name: "Vencido", color: "#EF4444" },
            { name: "Anulado", color: "#6B7280" },
        ],
        "tipo_auditoria": [
            { name: "Financiera", slug: "financiera" },
            { name: "Operativa", slug: "operativa" },
            { name: "Ambiental", slug: "ambiental" },
            { name: "RRHH", slug: "auditorias-rrhh" },
            { name: "Cumplimiento", slug: "cumplimiento" },
            { name: "Riesgos", slug: "riesgos" },
            { name: "Seguridad", slug: "seguridad" },
            { name: "Proyectos", slug: "auditorias-proyectos" },

        ],
        "estado_auditoria": [
            { name: "Completada", slug: "completada", color: "#10B981" },
            { name: "Pendiente", slug: "pendiente", color: "#F59E0B" },
        ],
        "estado_impuesto": [
            { name: "Pagado", color: "#10B981" },
            { name: "Pendiente", color: "#F59E0B" },
            { name: "Vencido", color: "#EF4444" },
            { name: "Anulado", color: "#6B7280" },
        ],
        "tipo_impuesto": [
            { name: "Retención en Fuente Impuesto de Renta", color: "#3B82F6" },
            { name: "Aportes Seguridad Social", color: "#8B5CF6" },
            { name: "Retenciones IVA, ICA, AIU", color: "#10B981" },
            { name: "Cajas de Compensación", color: "#F59E0B" },
            { name: "Régimen, Impuestos Renta", color: "#EC4899" },
            { name: "OTROS", color: "#14B8A6" },
        ],
        "estado_cotizacion": [
            { name: "Pendiente" },
            { name: "Enviada" },
            {
                name: "Aprobada",
            },
            {
                name: "Rechazada",
            },
        ],
        // Estado de Contacto
        "estado_contacto": [
            { name: "Activo" },
            { name: "Inactivo" },
            { name: "En evaluación" },
        ],

        // Tipo de Contacto
        "tipo_contacto": [{ name: "Persona" }, { name: "Empresa" }],

        // Tipo de Relación
        "tipo_relacion": [
            { name: "Cliente" },
            { name: "Proveedor" },
            { name: "Contratistas" },
            { name: "Partners" },
            { name: "Alianzas" },
        ],

        // Fuente
        "fuente": [
            { name: "Llamada en frío" },
            { name: "Redes sociales" },
            { name: "Marketing por correo electrónico" },
            { name: "Búsqueda orgánica" },
            { name: "Social pagado" },
            { name: "Búsqueda pagada" },
            { name: "Recomendación" },
            { name: "Tráfico directo" },
            { name: "Fuentes sin conexión" },
            { name: "Otro" },
        ],

        // Etiqueta de Contacto
        "etiqueta_contacto": [
            { name: "Lead Nuevo" },
            { name: "Interesado" },
            { name: "Potencial" },
            { name: "Frío" },
            { name: "Cliente" },
            { name: "Cliente Retirado" },
        ],

        // Estado de Caso
        "estado_caso": [
            { name: "Abierto" },
            { name: "En Proceso / En Espera" },
            { name: "Escalado" },
            { name: "Cerrado" },
        ],

        // Tipo de Caso
        "tipo_caso": [
            { name: "Cotización" },
            { name: "Solicitud de información" },
            { name: "Asesoría de diseño" },
            { name: "Agendamiento de visita" },
            { name: "Seguimiento a propuesta" },
            { name: "Interés en servicio específico" },
            { name: "Negociación comercial" },
            { name: "Consulta sobre portafolio" },
        ],

        // Estado de Aprobación
        "estado_aprobacion": [
            { name: "En espera" },
            { name: "Aprobado" },
            { name: "Rechazado" },
            { name: "Cancelado" },
        ],

        // Tipo de Prioridad
        "tipo_prioridad": [
            { name: "Alta" },
            { name: "Media" },
            { name: "Baja" },
        ],

        // Estado de Aprobador
        "estado_aprobador": [
            { name: "En espera" },
            { name: "Aprobado" },
            { name: "Rechazado" },
            { name: "Cancelado" },
        ],

        // Tipo de Política
        "tipo_politica": [
            { name: "Seguridad / Datos" },
            { name: "TI / Equipos" },
            { name: "RRHH / Modalidad" },
            { name: "Legal / Confidencialidad" },
        ],

        // Estado de Política
        "estado_politica": [
            { name: "Vigente" },
            { name: "Revision" },
            { name: "Firmada" },
        ],

        // Tipo de Certificado
        "tipo_certificado": [
            { name: "Empresarial" },
            { name: "Bancario" },
            { name: "Tecnico" },
            { name: "Proyecto / Obra" },
        ],

        // Estado de Certificado
        "estado_certificado": [
            { name: "Vigente" },
            { name: "Activo" },
            { name: "Proximo a vencer" },
            { name: "Emitido" },
            { name: "Vencido" },
        ],
        "estado_tarea": [
            { name: "Pendiente" },
            { name: "En proceso" },
            { name: "Completada" },
        ],
        "prioridad_tarea": [
            { name: "Alta" },
            { name: "Media" },
            { name: "Baja" },
        ],
        "estado_sub": [
            { name: "Activo" },
            { name: "Inactivo" },
            { name: "Proximo a vencer" },
            { name: "Vencido" },
        ],
        "frecuencia_sub": [
            { name: "Mensual" },
            { name: "Trimestral" },
            { name: "Semestral" },
            { name: "Anual" },
        ],
        "estado_reporte": [
            { name: "Pendiente" },
            { name: "Enviado" },
        ],
        // Género
        "genero": [
            { name: "Masculino" },
            { name: "Femenino" },
            { name: "Otro" },
            { name: "Prefiero no decir" },
        ],
        // Educación
        "educacion": [
            { name: "Primaria" },
            { name: "Secundaria" },
            { name: "Técnico" },
            { name: "Tecnólogo" },
            { name: "Profesional" },
            { name: "Especialización" },
            { name: "Maestría" },
            { name: "Doctorado" },
        ],
        // Estado Civil
        "estado_civil": [
            { name: "Soltero/a" },
            { name: "Casado/a" },
            { name: "Unión libre" },
            { name: "Divorciado/a" },
            { name: "Viudo/a" },
        ],
        "estado_vacante": [
            { name: "Activa" },
            { name: "Cerrada" },
            { name: "Contratado" },
            { name: "Entrevistas" },
            { name: "En revisión" },
        ],
        "tipo_contrato": [
            { name: "Tiempo completo" },
            { name: "Medio tiempo" },
            { name: "Por horas" },
            { name: "Temporal" },
            { name: "Por proyecto" },
            { name: "Prácticas" },
            { name: "Pasantía" },
            { name: "Contrato de aprendizaje" },
            { name: "Freelance" },
            { name: "Teletrabajo" },
            { name: "Híbrido" },
            { name: "Indefinido" },
            { name: "Obra o labor" },
        ],
        "estado_postulante": [
            { name: "Pendiente" },
            { name: "En revisión" },
            { name: "Aprobado" },
            { name: "Rechazado" },
            { name: "Entrevista" },
            { name: "Prueba técnica" },
        ],
        "estado_entrevista": [
            { name: "Programada", color: "#3B82F6" },
            { name: "Realizada", color: "#10B981" },
            { name: "Cancelada", color: "#EF4444" },
            { name: "Reprogramada", color: "#F59E0B" },
        ],
        "tipo_entrevista": [
            { name: "Técnica - Virtual", color: "#8B5CF6" },
            { name: "Técnica - Presencial", color: "#F4A261" },
            { name: "Entrevista de motivos generales", color: "#DC2626" },
            { name: "Entrevista de referencia", color: "#266B4E" },
            { name: "Entrevista de habilidades", color: "#667EEA" },
            { name: "Entrevista de comportamiento", color: "#EF4444" },
            { name: "Entrevista de motivación", color: "#F59E0B" },
            { name: "Entrevista de personalidad", color: "#F0932B" },
        ],
        "resultado_entrevista": [
            { name: "Apto", color: "#10B981" },
            { name: "No Apto", color: "#EF4444" },
            { name: "Requiere Prueba Técnica Adicional", color: "#F59E0B" },
        ],
        "tipo_licencia": [
            { name: "Licencia de Construcción", color: "#3B82F6" },
            { name: "Urbanización", color: "#10B981" },
            { name: "Parcelación", color: "#F59E0B" },
            { name: "Demolición", color: "#EF4444" },
            { name: "Intervención", color: "#8B5CF6" },
            { name: "Ocupación", color: "#EC4899" },
            { name: "Modificación", color: "#14B8A6" },
            { name: "Prorroga de licencia", color: "#43A047" },
            { name: "Otro", color: "#757575" },
        ],
        "estado_licencia": [
            { name: "En Trámite", color: "#F59E0B" },
            { name: "Aprobada", color: "#10B981" },
            { name: "Rechazada", color: "#EF4444" },
            { name: "En Revisión", color: "#3B82F6" },
            { name: "Observada", color: "#8B5CF6" },
            { name: "Vencida", color: "#6B7280" },
            { name: "Prorrogada", color: "#14B8A6" },
        ],
        "estado_estrategia": [
            { name: "Activa", color: "#10B981" },
            { name: "En Progreso", color: "#3B82F6" },
            { name: "Pausada", color: "#F59E0B" },
            { name: "Completada", color: "#8B5CF6" },
            { name: "Cancelada", color: "#EF4444" },
            { name: "Planificada", color: "#6B7280" },
            { name: "En Revisión", color: "#14B8A6" },
        ],
        "estado_publicacion": [
            { name: "Publicado", color: "#10B981" },
            { name: "Programado", color: "#3B82F6" },
            { name: "En Revisión", color: "#F59E0B" },
            { name: "Cancelado", color: "#EF4444" },
            { name: "Borrador", color: "#6B7280" },
            { name: "Pausado", color: "#F97316" },
        ],
        "tipo_caso_mk": [
            { name: "Lead", color: "#10B981" },
            { name: "Publicidad", color: "#3B82F6" },
            { name: "Pauta", color: "#F59E0B" },
            { name: "Web", color: "#EF4444" },
            { name: "Diseño", color: "#8B5CF6" },
            { name: "Social media", color: "#6B7280" },
            { name: "Incidente", color: "#F97316" },
        ],
        "estado_caso_mk": [
            { name: "Activo", color: "#10B981" },
            { name: "Inactivo", color: "#3B82F6" },
            { name: "En Revisión", color: "#F59E0B" },
            { name: "Aprobado", color: "#10B981" },
            { name: "Cerrado", color: "#8B5CF6" },
            { name: "Pendiente", color: "#F97316" },
        ],
        "tipo_pieza": [
            { name: "Imagen", color: "#3B82F6" },
            { name: "Video", color: "#F59E0B" },
            { name: "Flyer", color: "#10B981" },
            { name: "Historia RRSS", color: "#8B5CF6" },

        ],
        "formato": [
            { name: "MP4", color: "#10B981" },
            { name: "JPG", color: "#F59E0B" },
            { name: "PDF", color: "#EF4444" },

        ],
        "estado_pieza": [
            { name: "Aprobada", color: "#10B981" },
            { name: "En Revisión", color: "#F59E0B" },
            { name: "Pendiente", color: "#F97316" },
            { name: "Diseño inicial", color: "#F97316" },
        ],
        "tipo_evento": [
            { name: "Stand + Flyer", color: "#3B82F6" },
            { name: "Conferencia", color: "#10B981" },
            { name: "Taller", color: "#F59E0B" },
            { name: "Webinar", color: "#8B5CF6" },
            { name: "Lanzamiento Producto", color: "#EF4444" },
            { name: "Networking", color: "#EC4899" },
            { name: "Exposición", color: "#14B8A6" },
            { name: "Feria Comercial", color: "#43A047" },
        ],
        "estado_evento": [
            { name: "Planificado", color: "#3B82F6" },
            { name: "Confirmado", color: "#10B981" },
            { name: "En Progreso", color: "#F59E0B" },
            { name: "Ejecutado", color: "#8B5CF6" },
            { name: "Cancelado", color: "#EF4444" },
            { name: "Postergado", color: "#EC4899" },
        ],
        "unidad": [
            { name: "Unidad", color: "#3B82F6" },
            { name: "Pieza", color: "#2563EB" },
            { name: "Caja", color: "#F97316" },
            { name: "Paquete", color: "#6B7280" },
            { name: "Docena", color: "#D97706" },
            { name: "Centena", color: "#CA8A04" },
            { name: "Rollo", color: "#A16207" },
            { name: "Bolsa", color: "#b91c1c" },
            { name: "Pallet", color: "#92400E" },
            { name: "Contenedor", color: "#7C2D12" },

            // Peso
            { name: "Gramo", color: "#DC2626" },
            { name: "Kilogramo", color: "#EF4444" },
            { name: "Tonelada", color: "#991B1B" },

            // Longitud
            { name: "Milímetro", color: "#DB2777" },
            { name: "Centímetro", color: "#BE185D" },
            { name: "Metro", color: "#EC4899" },
            { name: "Kilómetro", color: "#9D174D" },
            { name: "Yarda", color: "#C026D3" },
            { name: "Pulgada", color: "#9333EA" },
            { name: "Pie", color: "#7E22CE" },

            // Área
            { name: "Metro cuadrado", color: "#14B8A6" },
            { name: "Hectárea", color: "#0F766E" },

            // Volumen
            { name: "Mililitro", color: "#1E40AF" },
            { name: "Litro", color: "#43A047" },
            { name: "Metro cúbico", color: "#0D9488" },
            { name: "Galón", color: "#0A7E6E" },
            { name: "Barril", color: "#036666" },

            // Tiempo
            { name: "Segundo", color: "#10B981" },
            { name: "Minuto", color: "#059669" },
            { name: "Hora", color: "#10B981" },
            { name: "Día", color: "#F59E0B" },
            { name: "Semana", color: "#D97706" },
            { name: "Mes", color: "#8B5CF6" },
            { name: "Año", color: "#6D28D9" },

            // Alimentos / Retail
            { name: "Botella", color: "#4C1D95" },
            { name: "Lata", color: "#5B21B6" },
            { name: "Tarro", color: "#6D28D9" },
            { name: "Bandeja", color: "#7C3AED" },
            { name: "Pack", color: "#8B5CF6" },

            // Construcción
            { name: "Pliego", color: "#0284C7" },
            { name: "Lámina", color: "#0369A1" },
            { name: "Barra", color: "#075985" },
            { name: "Saco", color: "#0EA5E9" },

            // Producción / Servicios
            { name: "Servicio", color: "#3F6212" },
            { name: "Proyecto", color: "#4D7C0F" },
            { name: "Tarea", color: "#65A30D" },
            { name: "Ticket", color: "#84CC16" },
        ],
        "tipo_proyecto": [
            { name: "Residencial", color: "#0284C7" },
            { name: "Comercial", color: "#0369A1" },
            { name: "Obra pública", color: "#075985" },
            { name: "Industrial", color: "#0EA5E9" },
            { name: "Hotelera", color: "#4C1D95" },
            { name: "Turística", color: "#5B21B6" },
            { name: "Hospitalaria", color: "#6D28D9" },
            { name: "Educativa", color: "#7C3AED" },
            { name: "Gubernamental", color: "#8B5CF6" },

        ],
        "estado_proyecto": [
            { name: "En planeación", color: "#E0E0E0" },
            { name: "En ejecución", color: "#FFC107" },
            { name: "En pausa", color: "#FF5722" },
            { name: "Finalizado", color: "#4CAF50" },
            { name: "Cancelado", color: "#9E9E9E" },
            { name: "Pendiente", color: "#2196F3" },
        ],
        "tipo_obra": [
            { name: "Nueva construcción", color: "#0284C7" },
            { name: "Mantenimiento", color: "#0369A1" },
            { name: "Reparación", color: "#075985" },
            { name: "Remodelación", color: "#0EA5E9" },
            { name: "Mobiliario", color: "#4C1D95" },
            { name: "Electricidad", color: "#5B21B6" },
            { name: "Plomería", color: "#6D28D9" },
            { name: "Calefacción", color: "#7C3AED" },
            { name: "Pavimentación", color: "#8B5CF6" },
            { name: "Obras civiles", color: "#0284C7" },
            { name: "Obras mecánicas", color: "#0369A1" },
            { name: "Obras eléctricas", color: "#075985" },
            { name: "Obras de plomería", color: "#0EA5E9" },
            { name: "Obras de calefacción", color: "#4C1D95" },
            { name: "Obras de instalaciones", color: "#5B21B6" },
            { name: "Obras de pavimentación", color: "#6D28D9" },
        ],
        "estado_obra": [
            { name: "En preparación", color: "#F3F4F6" },
            { name: "En ejecución", color: "#10B981" },
            { name: "En pausa", color: "#A0AEC0" },
            { name: "Finalizada", color: "#049372" },
            { name: "Cancelada", color: "#8B5CF6" },
            { name: "Pendiente", color: "#EC4C47" },
        ],
        "estado_punch_item": [
            { name: "En planeación", color: "#E0E0E0" },
            { name: "En ejecución", color: "#FFC107" },
            { name: "En pausa", color: "#FF5722" },
            { name: "Finalizado", color: "#4CAF50" },
            { name: "Cancelado", color: "#9E9E9E" },
            { name: "Pendiente", color: "#2196F3" },
        ],
        "estado_cambio": [
            { name: "Pendiente", color: "#2196F3" },
            { name: "Aprobado", color: "#00E676" },
            { name: "Rechazado", color: "#FF5252" },
        ],
        "tipo_cambio": [
            { name: "Material", color: "#00E676" },
            { name: "Diseño", color: "#00C853" },
            { name: "Estructura", color: "#66BB6A" },
            { name: "Instalaciones", color: "#81C784" },
            { name: "Otro", color: "#FFEB3B" },
        ],
        "impacto_presupuesto": [
            { name: "Sin impacto", color: "#E0E0E0" },
            { name: "Aumenta costo", color: "#FF5722" },
            { name: "Disminuye costo", color: "#4CAF50" },
        ],
        "estado_visita": [
            { name: "En revisión", color: "#FF5722" },
            { name: "Finalizada", color: "#4CAF50" },
            { name: "Cancelada", color: "#9E9E9E" },
            { name: "Pendiente", color: "#2196F3" },
        ],
        "tipo_vinculo": [
            { name: "Nómina", color: "#3B82F6" },
            { name: "Contratista", color: "#10B981" },
            { name: "Pasantía", color: "#F59E0B" },
            { name: "Prácticas", color: "#8B5CF6" },
            { name: "Servicios", color: "#EF4444" },
            { name: "Obra o labor", color: "#EC4899" },
        ],
        "estado_induccion": [
            { name: "Pendiente", color: "#F59E0B" },
            { name: "En proceso", color: "#3B82F6" },
            { name: "Completada", color: "#10B981" },
            { name: "Cancelada", color: "#EF4444" },
            { name: "Reprogramada", color: "#8B5CF6" },
        ],
        "confirmacion_induccion": [
            { name: "Confirmado", color: "#10B981" },
            { name: "Pendiente", color: "#F59E0B" },
            { name: "No asistió", color: "#EF4444" },
            { name: "Requiere seguimiento", color: "#8B5CF6" },
        ],
        "tipo_vacacion": [
            { name: "Vacaciones", color: "#10B981" },
            { name: "Permiso", color: "#F59E0B" },
        ],
        "estado_vacacion": [
            { name: "Aprobado", color: "#10B981" },
            { name: "En Revisión", color: "#F59E0B" },
            { name: "Rechazado", color: "#EF4444" },
        ],
        "estado_asistencia": [
            { name: "Presente", slug: "presente", color: "#4CAF50" },
            { name: "Retardo", slug: "retardo", color: "#FFC107" },
            { name: "Ausente", slug: "ausente", color: "#F44336" },
            { name: "Permiso médico", slug: "permiso_medico", color: "#2196F3" },
            { name: "Jornada Parcial", slug: "jornada_parcial", color: "#9C27B0" },
            { name: "Otro", slug: "otro", color: "#9E9E9E" },
        ],
        "modalidad_trabajo": [
            { name: "Presencial", color: "#4CAF50" },
            { name: "Remoto", color: "#FFC107" },
            { name: "Híbrido", color: "#F44336" },
        ],
        "estado_reunion": [
            { name: "Pendiente", color: "#F3E582" },
            { name: "En curso", color: "#FF5722" },
            { name: "Realizada", color: "#00C853" },
            { name: "Cancelada", color: "#E53935" },
        ],
        "estado_contrato": [
            { name: "Firmado", slug: "firmado", color: "#10B981" },
            { name: "En proceso", slug: "en_proceso", color: "#F59E0B" },
            { name: "Rechazado", slug: "rechazado", color: "#EF4444" },
            { name: "Cancelado", slug: "cancelado", color: "#6B7280" },
        ],
        "tipo_contrato_contratos": [
            { name: "Admin delegada Obra", slug: "admin_delegada_obra", color: "#60A5FA" },
            { name: "Obra todo costo", slug: "obra_todo_costo", color: "#34D399" },
            { name: "Subcontratacion a construct", slug: "subcontratacion_a_construct", color: "#FCD34D" },
            { name: "Servicio", slug: "servicio", color: "#A78BFA" },
            { name: "Tercerizacion", slug: "tercerizacion", color: "#F87171" },
            { name: "Obra labor", slug: "obra_labor", color: "#818CF8" },
            { name: "Termino fijo", slug: "termino_fijo", color: "#F472B6" },
            { name: "Termino Indefinido", slug: "termino_indefinido", color: "#2DD4BF" },
            { name: "Capacitacion de aprendiz-Práctica", slug: "capacitacion_de_aprendiz_practica", color: "#C084FC" },
            { name: "Compra Venta", slug: "compra_venta", color: "#FB923C" },
        ],

        "estado_offboarding": [
            { name: "Pendiente", color: "#F59E0B" },
            { name: "En proceso", color: "#3B82F6" },
            { name: "Finalizado", color: "#10B981" },
        ],
        "estado_campana": [
            { name: "Planificada", color: "#F59E0B" },
            { name: "Activa", color: "#10B981" },
            { name: "Pausada", color: "#FBBF24" },
            { name: "Finalizada", color: "#3B82F6" },
            { name: "Cancelada", color: "#EF4444" },
        ],
    };

    for (const [categorySlug, tagList] of Object.entries(tagsData)) {
        // Check if category exists
        const categoryResult = await db.select().from(tagCategories).where(eq(tagCategories.slug, categorySlug)).limit(1);

        if (categoryResult.length > 0) {
            const categoryId = categoryResult[0].id;

            for (const tag of tagList) {
                await db
                    .insert(tags)
                    .values({
                        name: tag.name,
                        slug: tag.slug || undefined, // Allow default generation if missing
                        color: tag.color,
                        categoryId: categoryId,
                    })
                    .onConflictDoNothing({ target: [tags.name, tags.categoryId] }); // Assuming name is unique per category or just using idempotency
            }
        } else {
            console.warn(`⚠️ Category ${categorySlug} not found. Skipping tags.`);
        }
    }

    console.log("✅ Tags seeded.");
}
