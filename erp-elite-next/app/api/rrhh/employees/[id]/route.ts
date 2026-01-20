import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { employees } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { DateService } from "@/lib/date-service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const employeeId = parseInt(id);

        const employee = await db.query.employees.findFirst({
            where: eq(employees.id, employeeId),
            with: {
                department: true,
                tag_genderId: true,
                tag_educationTypeId: true,
                tag_maritalStatusId: true
            }
        });

        if (!employee) {
            return new NextResponse("Employee not found", { status: 404 });
        }

        // Fetch associated files
        const { getFilesForModel } = await import("@/actions/files");
        const associatedFiles = await getFilesForModel("App\\Models\\Employee", employeeId);

        const employeeWithFiles = {
            ...employee,
            gender: employee.tag_genderId,
            educationType: employee.tag_educationTypeId,
            maritalStatus: employee.tag_maritalStatusId,
            tag_genderId: undefined,
            tag_educationTypeId: undefined,
            tag_maritalStatusId: undefined,
            files: associatedFiles
        };

        return NextResponse.json(employeeWithFiles);
    } catch (error) {
        console.error("Error fetching employee:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const employeeId = parseInt(id);
        const body = await req.json();

        await db.update(employees).set({
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

            updatedAt: DateService.toISO(),
        }).where(eq(employees.id, employeeId));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating employee:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return new NextResponse("El correo o identificación ya están registrados.", { status: 409 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const employeeId = parseInt(id);
        await db.delete(employees).where(eq(employees.id, employeeId));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
