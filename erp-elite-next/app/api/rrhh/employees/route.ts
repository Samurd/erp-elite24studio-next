import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees, departments } from "@/drizzle/schema";
import { eq, and, like, or, sql, desc, inArray } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const departmentId = searchParams.get('department_id');
    const jobTitle = searchParams.get('job_title');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    try {
        const filters = [];

        if (search) {
            filters.push(or(
                like(employees.fullName, `%${search}%`),
                like(employees.workEmail, `%${search}%`),
                like(employees.identificationNumber, `%${search}%`),
                like(employees.mobilePhone, `%${search}%`)
            ));
        }

        if (departmentId && departmentId !== 'all') {
            filters.push(eq(employees.departmentId, parseInt(departmentId)));
        }

        if (jobTitle) {
            filters.push(like(employees.jobTitle, `%${jobTitle}%`));
        }

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(employees)
            .where(and(...filters));
        const total = totalResult[0].count;

        const data = await db.query.employees.findMany({
            where: and(...filters),
            limit,
            offset,
            orderBy: [desc(employees.createdAt)],
            with: {
                department: true,
                // gender: true, // Assuming relations exist
                // educationType: true,
                // maritalStatus: true
            }
        });

        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                limit,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching employees:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();

        // Basic validation - extend as needed
        if (!body.full_name || !body.identification_number || !body.work_email) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Map frontend snake_case to DB camelCase if needed, or rely on Drizzle if keys match schema
        // Schema keys: fullName, jobTitle, workEmail, etc.
        // Frontend sends snake_case from form.

        const newEmployee = await db.insert(employees).values({
            fullName: body.full_name,
            jobTitle: body.job_title,
            workEmail: body.work_email,
            mobilePhone: body.mobile_phone,
            workAddress: body.work_address,
            workSchedule: body.work_schedule,
            departmentId: body.department_id ? parseInt(body.department_id) : null,

            identificationNumber: body.identification_number,
            passportNumber: body.passport_number || null,
            personalEmail: body.personal_email || null,
            privatePhone: body.private_phone || null,
            homeAddress: body.home_address || null,
            bankAccount: body.bank_account || null,
            socialSecurityNumber: body.social_security_number || null,

            genderId: body.gender_id ? parseInt(body.gender_id) : null,
            birthDate: body.birth_date ? DateService.toDB(DateService.parseToDate(body.birth_date)) : null,
            birthPlace: body.birth_place || null,
            birthCountry: body.birth_country || null,

            hasDisability: body.has_disability ? 1 : 0,
            disabilityDetails: body.disability_details || null,

            emergencyContactName: body.emergency_contact_name || null,
            emergencyContactPhone: body.emergency_contact_phone || null,

            educationTypeId: body.education_type_id ? parseInt(body.education_type_id) : null,
            maritalStatusId: body.marital_status_id ? parseInt(body.marital_status_id) : null,
            numberOfDependents: body.number_of_dependents ? parseInt(body.number_of_dependents) : 0,

            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        }).returning({ id: employees.id });

        if (newEmployee?.id && body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            try {
                const { attachFileToModel } = await import("@/actions/files");
                await Promise.all(body.pending_file_ids.map((fileId: number) =>
                    attachFileToModel(fileId, "App\\Models\\Employee", newEmployee.id)
                ));
            } catch (fileError) {
                console.error("Error attaching files:", fileError);
            }
        }

        // Handle files if needed (pending_file_ids) - would need LinkFileAction equivalent logic here
        // or a separate endpoint/service.

        return NextResponse.json({ success: true, id: newEmployee.id });

    } catch (error: any) {
        console.error("Error creating employee:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return new NextResponse("El correo o identificación ya están registrados.", { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
