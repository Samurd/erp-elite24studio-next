
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kpiRecords, files, filesLinks, users } from "@/drizzle/schema";
import { eq, desc, and, gte, lte, like, or } from "drizzle-orm";
import { z } from "zod";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DateService } from "@/lib/date-service";

const kpiRecordSchema = z.object({
    record_date: z.string().min(1), // Date string YYYY-MM-DD
    value: z.number(),
    observation: z.string().optional().nullable(),
    pending_file_ids: z.array(z.number()).optional(), // For new files uploaded previously or selecting existing
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const kpiId = parseInt(id);
        if (isNaN(kpiId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));
        const search = searchParams.get("search") || "";
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const offset = (page - 1) * pageSize;

        // Build WHERE clause
        const conditions = [eq(kpiRecords.kpiId, kpiId)];

        if (search) {
            conditions.push(
                or(
                    like(kpiRecords.observation, `%${search}%`),
                )
            );
        }

        if (dateFrom) {
            conditions.push(gte(kpiRecords.recordDate, dateFrom));
        }

        if (dateTo) {
            conditions.push(lte(kpiRecords.recordDate, dateTo));
        }

        const whereClause = and(...conditions);

        // Fetch records
        const data = await db.query.kpiRecords.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            orderBy: [desc(kpiRecords.recordDate)],
            with: {
                user: true, // createdBy
            },
        });

        // Fetch files for each record manually since polymorphic relations are complex in Drizzle `with`
        const recordsWithFiles = await Promise.all(data.map(async (record) => {
            const linkedFiles = await db
                .select({
                    id: files.id,
                    name: files.name,
                    path: files.path,
                    size: files.size,
                    mimeType: files.mimeType,
                })
                .from(files)
                .innerJoin(filesLinks, eq(filesLinks.fileId, files.id))
                .where(
                    and(
                        eq(filesLinks.fileableId, record.id),
                        eq(filesLinks.fileableType, 'App\\Models\\KpiRecord')
                    )
                );
            return { ...record, files: linkedFiles };
        }));

        // Total Count
        const totalResult = await db
            .select({ count: kpiRecords.id }) // Count IDs
            .from(kpiRecords)
            .where(whereClause);
        const total = totalResult.length;

        return NextResponse.json({
            data: recordsWithFiles,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });

    } catch (error) {
        console.error("Error fetching KPI records:", error);
        return NextResponse.json(
            { error: "Error fetching KPI records" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const kpiId = parseInt(id);
        if (isNaN(kpiId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await req.json();
        const validatedData = kpiRecordSchema.parse(body);

        // Create Record
        // TEMPORARY FIX: Use first user from DB
        const firstUser = await db.select().from(users).limit(1);
        if (!firstUser || firstUser.length === 0) {
            return NextResponse.json({ error: "No users found in database" }, { status: 500 });
        }
        const fallbackUserId = firstUser[0].id;

        const [newRecord] = await db.insert(kpiRecords).values({
            kpiId: kpiId,
            recordDate: validatedData.record_date,
            value: String(validatedData.value),
            observation: validatedData.observation,
            createdById: fallbackUserId,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        }).returning({ id: kpiRecords.id });

        const newRecordId = newRecord.id;

        // Link Files
        if (validatedData.pending_file_ids && validatedData.pending_file_ids.length > 0) {
            for (const fileId of validatedData.pending_file_ids) {
                await db.insert(filesLinks).values({
                    fileId: fileId,
                    fileableId: newRecordId,
                    fileableType: 'App\\Models\\KpiRecord',
                    createdAt: DateService.toISO(),
                    updatedAt: DateService.toISO(),
                });
            }
        }

        return NextResponse.json({ success: true, id: newRecordId });

    } catch (error) {
        console.error("Error creating KPI record:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error creating KPI record" },
            { status: 500 }
        );
    }
}
