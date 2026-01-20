
import { db } from "@/lib/db";
import { worksites } from "@/drizzle/schema";
import { and, desc, eq, ilike, or, gte, lte, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const typeId = searchParams.get("typeId");
        const statusId = searchParams.get("statusId");
        const projectId = searchParams.get("projectId");
        const responsibleId = searchParams.get("responsibleId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const offset = (page - 1) * pageSize;

        const filters = [];

        if (search) {
            filters.push(
                or(
                    ilike(worksites.name, `%${search}%`),
                    ilike(worksites.address, `%${search}%`)
                )
            );
        }

        if (typeId && typeId !== "all") {
            filters.push(eq(worksites.typeId, parseInt(typeId)));
        }

        if (statusId && statusId !== "all") {
            filters.push(eq(worksites.statusId, parseInt(statusId)));
        }

        if (projectId && projectId !== "all") {
            filters.push(eq(worksites.projectId, parseInt(projectId)));
        }

        if (responsibleId && responsibleId !== "all") {
            // worksites.responsibleId is varchar(36)
            filters.push(eq(worksites.responsibleId, responsibleId));
        }

        if (dateFrom) {
            filters.push(gte(worksites.startDate, dateFrom));
        }

        if (dateTo) {
            filters.push(lte(worksites.endDate, dateTo));
        }

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Get total count
        const totalCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(worksites)
            .where(whereClause);
        const totalCount = Number(totalCountResult[0].count);

        // Get data
        const data = await db.query.worksites.findMany({
            where: whereClause,
            with: {
                project: {
                    columns: { id: true, name: true },
                },
                type: true,
                status: true,
                responsible: {
                    columns: { id: true, name: true, profilePhotoUrl: true },
                },
            },
            orderBy: [desc(worksites.createdAt)],
            limit: pageSize,
            offset: offset,
        });

        return NextResponse.json({
            data,
            meta: {
                page,
                pageSize,
                total: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
            },
        });
    } catch (error) {
        console.error("Error fetching worksites:", error);
        return NextResponse.json(
            { error: "Error fetching worksites" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation could be improved here or done via Zod in the frontend/action
        // Basic required fields check
        if (!body.projectId || !body.name) {
            return NextResponse.json(
                { error: "Missing required fields (Project, Name)" },
                { status: 400 }
            );
        }

        const newWorksite = await db.insert(worksites).values({
            projectId: parseInt(body.projectId),
            name: body.name,
            typeId: body.typeId ? parseInt(body.typeId) : null,
            statusId: body.statusId ? parseInt(body.statusId) : null,
            responsibleId: body.responsibleId === "none" ? null : body.responsibleId,
            address: body.address,
            startDate: body.startDate, // Assuming 'YYYY-MM-DD'
            endDate: body.endDate,     // Assuming 'YYYY-MM-DD'
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning();

        return NextResponse.json(newWorksite[0]);

    } catch (error) {
        console.error("Error creating worksite:", error);
        return NextResponse.json(
            { error: "Error creating worksite" },
            { status: 500 }
        );
    }
}
