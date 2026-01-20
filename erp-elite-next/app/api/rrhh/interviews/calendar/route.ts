
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviews } from "@/drizzle/schema";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const data = await db.query.interviews.findMany({
            with: {
                applicant: true,
                interviewer: true,
                interviewType: true,
                status: true,
                result: true
            }
        });

        // Transform to FullCalendar events
        const events = data.map(interview => {
            // Determine color based on status (replicating backend logic)
            let color = '#3b82f6'; // Default blue
            if (interview.status) {
                switch (interview.status.name) {
                    case 'Programada':
                    case 'Scheduled':
                        color = '#3b82f6'; // Blue
                        break;
                    case 'Completada':
                    case 'Completed':
                        color = '#10b981'; // Green
                        break;
                    case 'Cancelada':
                    case 'Cancelled':
                        color = '#ef4444'; // Red
                        break;
                    case 'En Proceso':
                    case 'In Progress':
                        color = '#f59e0b'; // Amber
                        break;
                    default:
                        color = '#6b7280'; // Gray
                }
            }

            let start = interview.date;
            if (interview.time) {
                start = `${interview.date}T${interview.time}`; // Simplification, ensure format matches ISO
            }

            return {
                id: interview.id.toString(),
                title: `🎤 ${interview.applicant?.fullName || 'Entrevista'}`,
                start: start,
                color: color,
                extendedProps: {
                    applicant: interview.applicant?.fullName || 'N/A',
                    interviewer: interview.interviewer?.name || 'Sin asignar',
                    status: interview.status?.name || 'N/A',
                    type: interview.interviewType?.name || 'General'
                }
            };
        });

        return NextResponse.json(events);

    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
