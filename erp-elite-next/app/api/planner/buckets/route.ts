import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buckets } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, plan_id, order } = body;

        if (!name || !plan_id) {
            return new NextResponse("Name and Plan ID are required", { status: 400 });
        }

        const [newBucket] = await db.insert(buckets).values({
            name,
            planId: plan_id,
            order: order ?? 1,
            createdAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            updatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
        }).returning({ id: buckets.id });

        const bucketId = newBucket.id;

        const bucket = await db.query.buckets.findFirst({
            where: eq(buckets.id, bucketId)
        });

        return NextResponse.json(bucket);

    } catch (error) {
        console.error("Error creating bucket:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
