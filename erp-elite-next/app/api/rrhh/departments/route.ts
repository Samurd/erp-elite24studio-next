import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { departments } from "@/drizzle/schema";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const [result] = await db.insert(departments).values({
            name: name.trim(),
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        }).returning({ id: departments.id });

        return NextResponse.json({ id: result.id, name: name.trim() }, { status: 201 });
    } catch (error) {
        console.error("Error creating department:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
