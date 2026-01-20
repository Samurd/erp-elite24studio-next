import { db } from "@/lib/db";
import { tagCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedTagCategories() {
    console.log("🌱 Seeding Tag Categories...");

    const categories = [
        { slug: "resultado_ingreso", label: "Resultado de ingreso" },
        { slug: "categoria_ingreso", label: "Categoria de ingreso" },
        { slug: "tipo_ingreso", label: "Tipo de ingreso" },
        { slug: "categoria_gasto", label: "Categoria de gasto" },
        { slug: "estado_factura", label: "Estado de factura" },

        { slug: "estado_nomina", label: "Estado de nomina" },
        { slug: "tipo_auditoria", label: "Tipo de auditoria" },
        { slug: "estado_auditoria", label: "Estado de auditoria" },

        { slug: "estado_impuesto", label: "Estado de Impuesto" },
        { slug: "tipo_impuesto", label: "Tipo de Impuesto" },
        { slug: "estado_cotizacion", label: "Estado de cotizacion" },
        { slug: "estado_contacto", label: "Estado de Contacto" },
        { slug: "tipo_contacto", label: "Tipo de Contacto" },
        { slug: "tipo_relacion", label: "Tipo de Relación" },
        { slug: "fuente", label: "Fuente" },
        { slug: "etiqueta_contacto", label: "Etiqueta de Contacto" },
        { slug: "estado_caso", label: "Estado de Caso" },
        { slug: "tipo_caso", label: "Tipo de Caso" },
        { slug: "estado_aprobacion", label: "Estado de Aprobación" },
        { slug: "tipo_prioridad", label: "Tipo de Prioridad" },
        { slug: "estado_aprobador", label: "Estado de Aprobador" },
        { slug: "tipo_politica", label: "Tipo de Política" },
        { slug: "estado_politica", label: "Estado de Política" },
        { slug: "tipo_certificado", label: "Tipo de Certificado" },
        {
            slug: "estado_certificado",
            label: "Estado de Certificado",
        },
        { slug: "estado_tarea", label: "Estado de Tarea" },
        { slug: "prioridad_tarea", label: "Prioridad de Tarea" },
        { slug: "estado_sub", label: "Estado de Suscripción" },
        {
            slug: "frecuencia_sub",
            label: "Frecuencia de Suscripción",
        },
        { slug: "estado_reporte", label: "Estado de Reporte" },
        { slug: "genero", label: "Género" },
        { slug: "educacion", label: "Educación" },
        { slug: "estado_civil", label: "Estado Civil" },
        { slug: "estado_vacante", label: "Estado de vacante" },
        { slug: "tipo_contrato", label: "Tipo de contrato" },
        { slug: "estado_postulante", label: "Estado de postulante" },
        { slug: "estado_entrevista", label: "Estado de entrevista" },
        { slug: "tipo_entrevista", label: "Tipo de entrevista" },
        { slug: "resultado_entrevista", label: "Resultado de entrevista" },
        { slug: "tipo_licencia", label: "Tipo de licencia" },
        { slug: "estado_licencia", label: "Estado de licencia" },
        { slug: "estado_estrategia", label: "Estado de Estrategia" },
        { slug: "estado_publicacion", label: "Estado de Publicación" },
        { slug: "tipo_caso_mk", label: "Tipo de Caso de Marketing" },
        { slug: "estado_caso_mk", label: "Estado de Caso de Marketing" },
        { slug: "tipo_pieza", label: "Tipo de Pieza" },
        { slug: "formato", label: "Formato" },
        { slug: "estado_pieza", label: "Estado de Pieza" },
        { slug: "tipo_evento", label: "Tipo de Evento" },
        { slug: "estado_evento", label: "Estado de Evento" },
        { slug: "unidad", label: "Unidad" },
        { slug: "estado_proyecto", label: "Estado de Proyecto" },
        { slug: "tipo_proyecto", label: "Tipo de Proyecto" },
        { slug: "tipo_obra", label: "Tipo de Obra" },
        { slug: "estado_obra", label: "Estado de Obra" },
        { slug: "estado_punch_item", label: "Estado de Punch Item" },
        { slug: "estado_cambio", label: "Estado de Cambio" },
        { slug: "tipo_cambio", label: "Tipo de Cambio" },
        { slug: "impacto_presupuesto", label: "Impacto en presupuesto" },
        { slug: "estado_visita", label: "Estado de Visita" },
        { slug: "tipo_vinculo", label: "Tipo de Vínculo" },
        { slug: "estado_induccion", label: "Estado de Inducción" },
        { slug: "confirmacion_induccion", label: "Confirmación de Inducción" },
        { slug: "tipo_vacacion", label: "Tipo de Vacación" },
        { slug: "estado_vacacion", label: "Estado de Vacación" },
        { slug: "estado_asistencia", label: "Estado de Asistencia" },
        { slug: "modalidad_trabajo", label: "Modalidad de Trabajo" },

        { slug: "estado_reunion", label: "Estado de Reunión" },

        { slug: "estado_contrato", label: "Estado de Contrato" },
        { slug: "tipo_contrato_contratos", label: "Tipo de Contrato" },

        { slug: "estado_offboarding", label: "Estado de Off-boarding" },
        { slug: "horario_laboral", label: "Horario Laboral" },
        { slug: "estado_campana", label: "Estado de campaña" },
    ];

    for (const category of categories) {
        await db
            .insert(tagCategories)
            .values({
                slug: category.slug,
                label: category.label, // Corrected to use label as per schema
            })
            .onConflictDoNothing({ target: tagCategories.slug });
    }

    console.log("✅ Tag Categories seeded.");
}
