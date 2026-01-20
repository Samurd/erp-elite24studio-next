
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviews, applicants } from "@/drizzle/schema";
import { eq, and, desc, like, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const statusId = searchParams.get("statusId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const whereConditions = [];

        if (statusId && statusId !== 'all') {
            whereConditions.push(eq(interviews.statusId, parseInt(statusId)));
        }

        if (dateFrom) {
            whereConditions.push(gte(interviews.date, dateFrom));
        }

        if (dateTo) {
            whereConditions.push(lte(interviews.date, dateTo));
        }

        // Note: Relation filtering (filtering by applicant name) usually requires a different approach or joining
        // For simplicity with Drizzle query builder, we'll fetch with relations and might filter in memory or join if needed.
        // But for basic filtering we just stick to interview fields or use DB query API for text match.
        // Let's use db.query which allows easy relation fetching

        const data = await db.query.interviews.findMany({
            where: (interviews, { eq, and, gte, lte }) => {
                const conditions = [];
                if (statusId && statusId !== 'all') conditions.push(eq(interviews.statusId, parseInt(statusId)));
                if (dateFrom) conditions.push(gte(interviews.date, dateFrom));
                if (dateTo) conditions.push(lte(interviews.date, dateTo));
                return and(...conditions);
            },
            with: {
                applicant: true,
                interviewer: true,
                interviewType: true,
                status: true,
                result: true
            },
            orderBy: [desc(interviews.date), desc(interviews.time)]
        });

        // Manual search filtering if needed (since relations filtering in 'where' is complex in Drizzle's query API without raw SQL)
        const finalData = search ? data.filter(i =>
            i.applicant?.fullName.toLowerCase().includes(search.toLowerCase()) ||
            i.applicant?.email?.toLowerCase().includes(search.toLowerCase())
        ) : data;

        return NextResponse.json({ data: finalData });

    } catch (error) {
        console.error("Error fetching interviews:", error);
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

        // Safe parsing to prevent NaN values
        const safeParseInt = (val: any) => {
            if (!val) return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        // Basic Validation
        if (!body.applicant_id || !body.date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const newId = await db.insert(interviews).values({
            applicantId: safeParseInt(body.applicant_id) || 0,
            date: body.date,
            time: body.time,
            interviewerId: body.interviewer_id ? body.interviewer_id : session.user.id,
            interviewTypeId: safeParseInt(body.interview_type_id),
            statusId: safeParseInt(body.status_id),
            resultId: safeParseInt(body.result_id),
            platform: body.platform,
            platformUrl: body.platform_url,
            expectedResults: body.expected_results,
            interviewerObservations: body.interviewer_observations,
            rating: safeParseInt(body.rating),
        }).returning({ id: interviews.id });

        return NextResponse.json({ id: newId[0].id, message: "Entrevista creada exitosamente" });

    } catch (error) {
        console.error("Error creating interview:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
