import { db } from "@/lib/db";
import { areas } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function seedAreas() {
    console.log("🌱 Seeding Areas...");

    const areaData = [
        { name: "Usuarios", slug: "usuarios" },
        {
            name: "Finanzas",
            slug: "finanzas",
            subareas: [
                { name: 'Financiera', slug: 'financiera' },
                { name: 'Operativa', slug: 'operativa' },
                { name: 'Ambiental', slug: 'ambiental' },
                { name: 'RRHH', slug: 'auditorias-rrhh' },
                { name: 'Cumplimiento', slug: 'cumplimiento' },
                { name: 'Riesgos', slug: 'riesgos' },
                { name: 'Seguridad', slug: 'seguridad' },
                { name: 'Proyectos', slug: 'auditorias-proyectos' },
            ],
        },
        { name: "Cotizaciones", slug: "cotizaciones" },
        { name: "Contactos", slug: "contactos" },
        { name: "Donaciones", slug: "donaciones" },
        { name: "Registro-Casos", slug: "registro-casos" },
        { name: "Reportes", slug: "reportes" },
        { name: "Aprobaciones", slug: "aprobaciones" },
        { name: "Políticas", slug: "politicas" },
        { name: "Certificados", slug: "certificados" },
        { name: "Trámites y Licencias", slug: "licencias" },
        { name: "Suscripciones", slug: "suscripciones" },
        { name: "Recursos Humanos", slug: "rrhh" },
        { name: "KPIS/Control calidad", slug: "kpis" },
        { name: "Proyectos", slug: "proyectos" },
        { name: "Obras", slug: "obras" },
        { name: "Marketing", slug: "marketing" },
        { name: "Cloud", slug: "cloud" },
        { name: "Teams", slug: "teams" },
        { name: "Reuniones", slug: "reuniones" },
    ];

    for (const data of areaData) {
        // Insert parent area
        await db.insert(areas).values({
            name: data.name,
            slug: data.slug,
        }).onConflictDoNothing({ target: areas.slug });

        // Retrieve parent area ID
        const parentArea = await db.query.areas.findFirst({
            where: eq(areas.slug, data.slug),
        });

        if (parentArea && data.subareas) {
            for (const sub of data.subareas) {
                await db.insert(areas).values({
                    name: sub.name,
                    slug: sub.slug,
                    parentId: parentArea.id,
                }).onConflictDoNothing({ target: areas.slug });
            }
        }
    }

    console.log("✅ Areas seeded.");
}
