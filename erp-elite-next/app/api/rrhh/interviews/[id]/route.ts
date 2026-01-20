
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviews } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        const interview = await db.query.interviews.findFirst({
            where: eq(interviews.id, parseInt(id)),
            with: {
                applicant: true,
                interviewer: true,
                interviewType: true,
                status: true,
                result: true
            }
        });

        if (!interview) {
            return new NextResponse("Interview not found", { status: 404 });
        }

        return NextResponse.json(interview);

    } catch (error) {
        console.error("Error fetching interview:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        const body = await req.json();

        // Safe parsing to prevent NaN values or empty strings
        const safeParseInt = (val: any) => {
            if (!val) return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        await db.update(interviews).set({
            applicantId: safeParseInt(body.applicant_id),
            date: body.date, // Assuming it's already in DB format or handled by frontend DateService
            time: body.time,
            interviewerId: body.interviewer_id, // UUID string, no parse needed
            interviewTypeId: safeParseInt(body.interview_type_id),
            statusId: safeParseInt(body.status_id),
            resultId: safeParseInt(body.result_id),
            platform: body.platform,
            platformUrl: body.platform_url,
            expectedResults: body.expected_results,
            interviewerObservations: body.interviewer_observations,
            rating: safeParseInt(body.rating),
        }).where(eq(interviews.id, parseInt(id)));

        return NextResponse.json({ message: "Entrevista actualizada exitosamente" });

    } catch (error) {
        console.error("Error updating interview:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    try {
        await db.delete(interviews).where(eq(interviews.id, parseInt(id)));
        return NextResponse.json({ message: "Entrevista eliminada exitosamente" });

    } catch (error) {
        console.error("Error deleting interview:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
