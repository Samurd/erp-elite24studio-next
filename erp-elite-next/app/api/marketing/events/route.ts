import { db } from "@/lib/db";
import { events, filesLinks, areas, folders } from "@/drizzle/schema";
import { eq, like, and, desc, sql, or, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("perPage") || "10");
        const search = searchParams.get("search") || "";
        const typeId = searchParams.get("type_filter");
        const statusId = searchParams.get("status_filter");
        const responsibleId = searchParams.get("responsible_filter");
        const dateFrom = searchParams.get("date_from");
        const dateTo = searchParams.get("date_to");

        const offset = (page - 1) * pageSize;

        const whereConditions = [];

        if (search) {
            whereConditions.push(
                or(
                    like(events.name, `%${search}%`),
                    like(events.location, `%${search}%`)
                )
            );
        }

        if (typeId) {
            whereConditions.push(eq(events.typeId, parseInt(typeId)));
        }

        if (statusId) {
            whereConditions.push(eq(events.statusId, parseInt(statusId)));
        }

        if (responsibleId) {
            whereConditions.push(eq(events.responsibleId, responsibleId));
        }

        if (dateFrom) {
            whereConditions.push(gte(events.eventDate, dateFrom));
        }

        if (dateTo) {
            whereConditions.push(lte(events.eventDate, dateTo));
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        const [rows] = await db
            .select({ count: sql<number>`count(*)` })
            .from(events)
            .where(whereClause);

        const total = rows.count;

        const data = await db.query.events.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            orderBy: [desc(events.eventDate)],
            with: {
                type: true,
                status: true,
                responsible: true,
                eventItems: true, // Need items to calculate total budget
            },
        });

        return NextResponse.json({
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Error fetching events" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            type_id,
            event_date,
            location,
            status_id,
            responsible_id,
            observations,
            pending_file_ids,
        } = body;

        // Validate required fields
        if (!name || !type_id || !event_date || !status_id || !responsible_id || !location) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const [result] = await db.insert(events).values({
            name,
            typeId: parseInt(type_id),
            eventDate: event_date,
            location,
            statusId: parseInt(status_id),
            responsibleId: responsible_id,
            observations: observations || null,
            createdAt: DateService.toISO(),
            updatedAt: DateService.toISO(),
        }).returning({ id: events.id });

        const newEventId = result.id;

        // Handle File Attachments
        if (pending_file_ids && pending_file_ids.length > 0) {
            const marketingArea = await db.query.areas.findFirst({
                where: eq(areas.slug, "marketing"),
            });

            if (marketingArea) {
                for (const fileId of pending_file_ids) {
                    // Check if link already exists to avoid duplicates
                    const existingLink = await db.query.filesLinks.findFirst({
                        where: and(
                            eq(filesLinks.fileId, fileId),
                            eq(filesLinks.fileableId, newEventId),
                            eq(filesLinks.fileableType, "App\\Models\\Event")
                        )
                    });

                    if (!existingLink) {
                        await db.insert(filesLinks).values({
                            areaId: marketingArea.id,
                            fileId: fileId,
                            fileableType: "App\\Models\\Event",
                            fileableId: newEventId,
                            createdAt: DateService.toISO(),
                            updatedAt: DateService.toISO(),
                        });
                    }
                }
            }
        }

        return NextResponse.json({ id: newEventId, message: "Evento creado exitosamente" }, { status: 201 });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Error creating event" },
            { status: 500 }
        );
    }
}
