
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kits, users, tags } from "@/drizzle/schema";
import { desc, eq, and, like, or, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const statusId = searchParams.get("statusId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const whereConditions = [];

        if (search) {
            whereConditions.push(
                or(
                    like(kits.recipientName, `%${search}%`),
                    like(kits.recipientRole, `%${search}%`),
                    like(kits.positionArea, `%${search}%`),
                    like(kits.kitType, `%${search}%`)
                )
            );
        }

        if (statusId && statusId !== "all") {
            whereConditions.push(eq(kits.statusId, parseInt(statusId)));
        }

        if (dateFrom) {
            whereConditions.push(gte(kits.requestDate, dateFrom));
        }

        if (dateTo) {
            whereConditions.push(lte(kits.requestDate, dateTo));
        }

        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

        // Get total count
        const totalResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(kits)
            .where(whereClause);

        const total = Number(totalResult[0]?.count || 0);
        const totalPages = Math.ceil(total / limit);

        // Get paginated data
        const data = await db.query.kits.findMany({
            where: whereClause,
            with: {
                requestedByUser: true,
                deliveryResponsibleUser: true,
                status: true,
            },
            orderBy: [desc(kits.requestDate)],
            limit: limit,
            offset: (page - 1) * limit,
        });

        return NextResponse.json({
            data,
            total,
            page,
            limit,
            totalPages
        });
    } catch (error) {
        console.error("Error fetching kits:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();

        // Basic validation
        if (!body.recipient_name || !body.position_area || !body.request_date) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify the user exists in the database
        // Verify the user exists in the database
        const userId = session.user.id;
        const userExists = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        console.log("Session user ID:", userId);
        console.log("User exists in DB:", !!userExists);

        const result = await db.insert(kits).values({
            recipientName: body.recipient_name,
            recipientRole: body.recipient_role || "",
            positionArea: body.position_area,
            kitType: body.kit_type || "",
            kitContents: body.kit_contents,
            requestDate: body.request_date,
            deliveryDate: body.delivery_date || null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            // Only set requestedByUserId if the user exists in the database
            requestedByUserId: userExists ? userId : null,
            deliveryResponsibleUserId: body.delivery_responsible_user_id || null,
            observations: body.observations,
        }).returning({ id: kits.id });

        // Get the inserted ID from the result
        const insertId = result[0].id;

        return NextResponse.json({ id: insertId, success: true });
    } catch (error) {
        console.error("Error creating kit:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
