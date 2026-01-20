
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offBoardings, offBoardingTasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const offboarding = await db.query.offBoardings.findFirst({
            where: eq(offBoardings.id, parseInt(id)),
            with: {
                employee: true,
                project: true,
                status: true,
                responsible: true,
                tasks: {
                    with: {
                        team: true,
                        completedBy: true
                    }
                }
            },
        });

        if (!offboarding) {
            return NextResponse.json(
                { error: "Offboarding not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(offboarding);
    } catch (error) {
        console.error("Error fetching offboarding:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        await db
            .update(offBoardings)
            .set({
                employeeId: body.employee_id,
                projectId: body.project_id || null,
                reason: body.reason || null,
                exitDate: DateService.toDB(DateService.parseToDate(body.exit_date)),
                statusId: body.status_id || null,
                responsibleId: body.responsible_id || null,
                updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            })
            .where(eq(offBoardings.id, parseInt(id)));

        return NextResponse.json({ message: "Offboarding updated successfully" });
    } catch (error) {
        console.error("Error updating offboarding:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await db.delete(offBoardings).where(eq(offBoardings.id, parseInt(id)));

        return NextResponse.json({ message: "Offboarding deleted successfully" });
    } catch (error) {
        console.error("Error deleting offboarding:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
