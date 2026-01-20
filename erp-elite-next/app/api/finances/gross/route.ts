import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { incomes } from "@/drizzle/schema";
import { and, desc, eq, like, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
        conditions.push(
            or(
                like(incomes.name, `%${search}%`),
                like(incomes.description, `%${search}%`)
            )
        );
    }

    try {
        const data = await db.query.incomes.findMany({
            where: and(...conditions),
            with: {
                tag_categoryId: true,
                tag_resultId: true,
                user: true,
                tag_typeId: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(incomes.createdAt)],
        });

        // Map relations to expected frontend structure
        const formattedData = data.map(item => ({
            ...item,
            category: item.tag_categoryId,
            result: item.tag_resultId,
            createdBy: item.user,
            type: item.tag_typeId,
        }));

        // Basic count
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(incomes)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data: formattedData,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching gross incomes:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation based on Laravel controller
        // 'name' => 'required|string',
        // 'type_id' => 'required',
        // 'category_id' => 'nullable',
        // 'description' => 'nullable|string',
        // 'date' => 'required|date',
        // 'amount' => 'required|integer|min:0',
        // 'created_by_id' => 'required',
        // 'result_id' => 'required',

        if (!body.name || !body.type_id || !body.date || !body.amount || !body.created_by_id || !body.result_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.insert(incomes).values({
            name: body.name,
            typeId: parseInt(body.type_id),
            categoryId: body.category_id ? parseInt(body.category_id) : null,
            description: body.description,
            date: body.date,
            amount: parseInt(body.amount),
            createdById: body.created_by_id, // string(36)
            resultId: parseInt(body.result_id),
        }).returning({ id: incomes.id });

        const insertedId = result[0]?.id;

        return NextResponse.json({ id: insertedId, message: "Income created successfully" }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating gross income:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
