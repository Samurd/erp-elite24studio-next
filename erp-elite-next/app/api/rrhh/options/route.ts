import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, tags, tagCategories, departments, users, contacts, projects, teams } from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";
import { StorageService } from "@/lib/storage-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug");

        // Helper to get tags by category slug
        const getTags = async (categorySlug: string) => {
            const category = await db.query.tagCategories.findFirst({
                where: eq(tagCategories.slug, categorySlug)
            });
            if (!category) return [];

            return db.select().from(tags).where(eq(tags.categoryId, category.id));
        }

        // Handle specific slug requests for vacancies module
        if (slug === 'tipo_contrato') {
            const contractTypes = await getTags('tipo_contrato_contratos');
            return NextResponse.json(contractTypes);
        }

        if (slug === 'estado_vacante') {
            const vacancyStatuses = await getTags('estado_vacante');
            return NextResponse.json(vacancyStatuses);
        }

        if (slug === 'estado_postulante') {
            const applicantStatuses = await getTags('estado_postulante');
            return NextResponse.json(applicantStatuses);
        }

        if (slug === 'tipo_entrevista') {
            const options = await getTags('tipo_entrevista');
            return NextResponse.json(options);
        }

        if (slug === 'estado_entrevista') {
            const options = await getTags('estado_entrevista');
            return NextResponse.json(options);
        }

        if (slug === 'resultado_entrevista') {
            const options = await getTags('resultado_entrevista');
            return NextResponse.json(options);
        }

        // Special case: if slug is 'users' and no include params, return just users
        if (slug === 'users' && !searchParams.get("include") && !searchParams.get("include2") && !searchParams.get("include3")) {
            console.log("Fetching users list from DB...");
            const usersData = await db.query.users.findMany({
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            });
            console.log("Users found:", usersData.length);
            const resolvedUsers = await Promise.all(usersData.map(async (u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                profilePhotoPath: await StorageService.getUrl(u.image)
            })));
            return NextResponse.json(resolvedUsers);
        }

        const _employees = await db.select().from(employees).orderBy(employees.fullName);
        const _departments = await db.select().from(departments).orderBy(departments.name);

        const typeOptions = await getTags('tipo_contrato_contratos');
        const categoryOptions = await getTags('tipo_relacion');
        const statusOptions = await getTags('estado_contrato');
        const scheduleOptions = await getTags('horario_laboral');

        // Employee specific options
        const genderOptions = await getTags('genero');
        const educationOptions = await getTags('educacion');
        const maritalStatusOptions = await getTags('estado_civil');

        // Interview specific options
        const interviewTypeOptions = await getTags('tipo_entrevista');
        const interviewStatusOptions = await getTags('estado_entrevista');
        const interviewResultOptions = await getTags('resultado_entrevista');

        // Induction specific options
        const typeBondOptions = await getTags('tipo_vinculo');
        const inductionStatusOptions = await getTags('estado_induccion');
        const confirmationOptions = await getTags('confirmacion_induccion');

        // Kit specific options
        const kitStatusOptions = await getTags('estado_kit');

        // Offboarding specific options
        // Offboarding specific options
        const offboardingStatusOptions = await getTags('estado_offboarding');

        // Holiday specific options
        const holidayTypeOptions = await getTags('tipo_vacacion');
        const holidayStatusOptions = await getTags('estado_vacacion');

        // Attendance specific options
        const attendanceStatusOptions = await getTags('estado_asistencia');
        const attendanceModalityOptions = await getTags('modalidad_trabajo');

        // Projects & Teams
        const _projects = await db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(projects.name);
        const _teams = await db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(teams.name);

        // Handle include parameters for birthdays and other modules
        const response: any = {
            employees: _employees,
            departments: _departments,
            typeOptions,
            categoryOptions,
            statusOptions,
            scheduleOptions,
            genderOptions,
            educationOptions,
            maritalStatusOptions,
            interviewTypeOptions,
            interviewStatusOptions,
            interviewResultOptions,
            typeBondOptions,
            inductionStatusOptions,
            confirmationOptions,
            kitStatusOptions,
            offboardingStatusOptions,
            holidayTypeOptions,
            holidayStatusOptions,
            attendanceStatusOptions,
            attendanceModalityOptions,
            projects: _projects,
            teams: _teams
        };

        // Check for include parameters
        const include = searchParams.get("include");
        const include2 = searchParams.get("include2");
        const include3 = searchParams.get("include3");

        if (include === "users" || include2 === "users" || include3 === "users") {
            const usersData = await db.query.users.findMany({
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                },
                orderBy: asc(users.name)
            });
            response.users = await Promise.all(usersData.map(async (u) => ({
                ...u,
                image: await StorageService.getUrl(u.image)
            })));
        }

        if (include === "employees" || include2 === "employees" || include3 === "employees") {
            response.employees = _employees;
        }

        if (include === "contacts" || include2 === "contacts" || include3 === "contacts") {
            response.contacts = await db.select().from(contacts).orderBy(contacts.name);
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching RRHH options:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
