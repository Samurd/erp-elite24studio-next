import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenses, filesLinks } from "@/drizzle/schema";
import { desc, like, or, eq, sql, and } from "drizzle-orm";
import { getFilesForModel } from "@/actions/files";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
            conditions.push(or(
                like(expenses.name, `%${search}%`),
                like(expenses.description, `%${search}%`)
            ));
        }

        const data = await db.query.expenses.findMany({
            where: and(...conditions),
            with: {
                tag_categoryId: true,
                tag_resultId: true,
                user: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(expenses.createdAt)],
        });

        // Fetch files for each expense
        // This acts as "map relations" and also adding files
        // We use Promise.all to fetch files for each item efficiently? 
        // Or fetch all links? Fetching individually is easier to implement now.
        // N+1 problem but manageable for page size 10.
        const formattedData = await Promise.all(data.map(async (item) => {
            const expenseFiles = await getFilesForModel('App\\Models\\Expense', item.id);
            return {
                ...item,
                category: item.tag_categoryId,
                result: item.tag_resultId,
                createdBy: item.user,
                files: expenseFiles
            };
        }));

        // Basic count
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(expenses)
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
        console.error("Error fetching expenses:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.name || !body.category_id || !body.date || !body.amount || !body.created_by_id || !body.result_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [newExpense] = await db.insert(expenses).values({
            name: body.name,
            categoryId: parseInt(body.category_id),
            description: body.description,
            date: body.date,
            amount: parseInt(body.amount), // Expecting cents or units? Usually input is handled. Assuming backend stores what it gets. User specified MoneyInput handles logic. Form sends what MoneyInput gives.
            createdById: body.created_by_id, // UUID string
            resultId: parseInt(body.result_id),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }).returning({ id: expenses.id });

        return NextResponse.json({
            message: "Expense created successfully",
            id: newExpense.id
        }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating expense:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
