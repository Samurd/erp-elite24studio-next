
import { db } from "@/lib/db";
import { roles } from "@/drizzle/schema";
import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const data = await db.query.roles.findMany({
            orderBy: [asc(roles.name)],
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching KPI options:", error);
        return NextResponse.json(
            { error: "Error fetching options" },
            { status: 500 }
        );
    }
}
