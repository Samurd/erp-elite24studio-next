
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { holidays, filesLinks, files } from "@/drizzle/schema";
import { DateService } from "@/lib/date-service";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";

const holidaySchema = z.object({
    employee_id: z.coerce.number(),
    type_id: z.coerce.number().optional().nullable(),
    start_date: z.string(),
    end_date: z.string(),
    status_id: z.preprocess((val) => val === "" ? null : val, z.coerce.number().optional().nullable()),
    approver_id: z.preprocess((val) => val === "" ? null : val, z.string().optional().nullable()),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const holidayId = parseInt(id);

    try {
        const holiday = await db.query.holidays.findFirst({
            where: eq(holidays.id, holidayId),
            with: {
                employee: true,
                type: true,
                status: true,
                approver: true,
            }
        });

        if (!holiday) {
            return new NextResponse("Holiday not found", { status: 404 });
        }

        // Fetch files manually since polymorphism is tricky with Drizzle relations sometimes, 
        // or ensure a direct relation exists. Laravel uses polymorphism.
        // We query files_links where fileable_type = 'App\Models\Holiday' and fileable_id = id
        // Then join files.
        const attachedFiles = await db
            .select({
                id: files.id,
                name: files.name,
                path: files.path,
                mimeType: files.mimeType,
                size: files.size,
                disk: files.disk,
                url: sql<string>`CONCAT('/storage/', ${files.path})` // Simple URL construction, might need adjustment based on storage driver
            })
            .from(files)
            .innerJoin(filesLinks, eq(files.id, filesLinks.fileId))
            .where(and(
                eq(filesLinks.fileableId, holidayId),
                eq(filesLinks.fileableType, 'App\\Models\\Holiday')
            ));

        // Historical Data & Stats logic
        // We can fetch this in a separate call or include it here.
        // Let's check for a query param 'include_stats'
        const { searchParams } = new URL(req.url);
        const includeStats = searchParams.get("include_stats") === 'true';
        let historicalData = null;
        let stats = null;

        if (includeStats) {
            const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

            // Historical
            const history = await db.query.holidays.findMany({
                where: and(
                    eq(holidays.employeeId, holiday.employeeId),
                    sql`EXTRACT(YEAR FROM ${holidays.startDate}) = ${year}`
                ),
                orderBy: [desc(holidays.startDate)],
                with: {
                    type: true,
                    status: true,
                }
            });

            // Stats calculation
            let totalDays = 0;
            let lastDate = null;

            history.forEach(h => {
                const start = new Date(h.startDate);
                const end = new Date(h.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                totalDays += diffDays;

                if (!lastDate || end > new Date(lastDate)) {
                    lastDate = h.endDate;
                }
            });

            historicalData = history;
            stats = {
                totalDays,
                requestsInYear: history.length,
                lastDate
            };
        }

        return NextResponse.json({
            ...holiday,
            files: attachedFiles,
            historicalData,
            stats
        });

    } catch (error) {
        console.error("Error fetching holiday details:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const validated = holidaySchema.parse(body);

        await db.update(holidays).set({
            employeeId: validated.employee_id,
            typeId: validated.type_id || null,
            startDate: DateService.toDB(DateService.parseToDate(validated.start_date)),
            endDate: DateService.toDB(DateService.parseToDate(validated.end_date)),
            statusId: validated.status_id || null,
            approverId: validated.approver_id || null,
        }).where(eq(holidays.id, parseInt(id)));

        // Handle pending files if new ones added in edit mode
        if ((body as any).pending_file_ids && (body as any).pending_file_ids.length > 0) {
            const { filesLinks } = await import("@/drizzle/schema");

            const fileLinks = (body as any).pending_file_ids.map((fileId: number) => ({
                fileId: fileId,
                fileableId: parseInt(id),
                fileableType: "App\\Models\\Holiday",
            }));

            await db.insert(filesLinks).values(fileLinks);
        }

        return NextResponse.json({ message: "Solicitud actualizada exitosamente" });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.errors), { status: 400 });
        }
        console.error("Error updating holiday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        await db.delete(holidays).where(eq(holidays.id, parseInt(id)));
        return NextResponse.json({ message: "Solicitud eliminada exitosamente" });
    } catch (error) {
        console.error("Error deleting holiday:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
