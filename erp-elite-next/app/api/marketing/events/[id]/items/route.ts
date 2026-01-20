import { db } from "@/lib/db";
import { eventItems, filesLinks, areas } from "@/drizzle/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET Items for an Event
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("perPage") || "10");
        const search = searchParams.get("search") || "";
        const unitId = searchParams.get("unitFilter");

        const offset = (page - 1) * pageSize;
        const eventId = parseInt(id);

        const whereConditions = [eq(eventItems.eventId, eventId)];

        if (search) {
            whereConditions.push(like(eventItems.description, `%${search}%`));
        }

        if (unitId) {
            whereConditions.push(eq(eventItems.unitId, parseInt(unitId)));
        }

        const whereClause = and(...whereConditions);

        const [rows] = await db
            .select({ count: sql<number>`count(*)` })
            .from(eventItems)
            .where(whereClause);

        const total = rows.count;

        const data = await db.query.eventItems.findMany({
            where: whereClause,
            limit: pageSize,
            offset: offset,
            with: {
                unit: true,
                // We might need to fetch files for items too
            },
        });

        // Manually fetch files for each item
        const dataWithFiles = await Promise.all(data.map(async (item) => {
            const linkedFiles = await db.query.filesLinks.findMany({
                where: (filesLinks, { and, eq }) => and(
                    eq(filesLinks.fileableType, "App\\Models\\EventItem"),
                    eq(filesLinks.fileableId, item.id)
                ),
                with: {
                    file: true
                }
            });
            return {
                ...item,
                files: linkedFiles.map(link => link.file)
            };
        }));


        return NextResponse.json({
            data: dataWithFiles,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });

    } catch (error) {
        console.error("Error fetching event items:", error);
        return NextResponse.json(
            { error: "Error fetching event items" },
            { status: 500 }
        );
    }
}

// POST Create Item
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const {
            description,
            quantity,
            unit_id,
            unit_price,
            total_price,
            pending_file_ids
        } = body;

        if (!description || !quantity || !unit_id || !unit_price) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const [result] = await db.insert(eventItems).values({
            eventId: parseInt(id),
            description,
            quantity: parseFloat(quantity),
            unitId: parseInt(unit_id),
            unitPrice: parseFloat(unit_price),
            totalPrice: parseFloat(total_price), // Or calculate it here: quantity * unitPrice
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).returning({ id: eventItems.id });

        const newItemId = result.id;

        // Handle File Attachments for Item
        if (pending_file_ids && pending_file_ids.length > 0) {
            for (const fileItem of pending_file_ids) {
                // Extract ID if fileItem is an object, otherwise use it directly
                const fileId = typeof fileItem === 'object' && fileItem.id ? fileItem.id : fileItem;

                const existingLink = await db.query.filesLinks.findFirst({
                    where: and(
                        eq(filesLinks.fileId, fileId),
                        eq(filesLinks.fileableId, newItemId),
                        eq(filesLinks.fileableType, "App\\Models\\EventItem")
                    )
                });

                if (!existingLink) {
                    await db.insert(filesLinks).values({
                        fileId: fileId,
                        fileableType: "App\\Models\\EventItem",
                        fileableId: newItemId,
                        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
                    });
                }
            }
        }

        return NextResponse.json({ id: newItemId, message: "Ítem agregado exitosamente" }, { status: 201 });

    } catch (error) {
        console.error("Error creating event item:", error);
        return NextResponse.json(
            { error: "Error creating event item" },
            { status: 500 }
        );
    }
}
