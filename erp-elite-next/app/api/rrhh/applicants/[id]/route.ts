import { db } from "@/lib/db";
import { applicants } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        const applicant = await db.query.applicants.findFirst({
            where: eq(applicants.id, id),
            with: {
                vacancy: true,
                status: true
            }
        });

        if (!applicant) {
            return new NextResponse("Applicant not found", { status: 404 });
        }

        return NextResponse.json({
            ...applicant,
            full_name: applicant.fullName,
            vacancy_id: applicant.vacancyId,
            status_id: applicant.statusId,
            created_at: applicant.createdAt
        });
    } catch (error) {
        console.error("Error fetching applicant:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const body = await request.json();

        await db.update(applicants)
            .set({
                fullName: body.full_name,
                email: body.email,
                vacancyId: body.vacancy_id ? parseInt(body.vacancy_id) : undefined,
                statusId: body.status_id ? parseInt(body.status_id) : null,
                notes: body.notes,
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            })
            .where(eq(applicants.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating applicant:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        await db.delete(applicants).where(eq(applicants.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting applicant:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
