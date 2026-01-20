import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buckets } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { buckets: orderedIds } = await req.json();

        if (!Array.isArray(orderedIds)) {
            return new NextResponse("Invalid data", { status: 400 });
        }

        // Transactional update would be better, but loop is acceptable for MVP
        const promises = orderedIds.map((id: number, index: number) => {
            return db.update(buckets)
                .set({ order: index })
                .where(eq(buckets.id, id));
        });

        await Promise.all(promises);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error reordering buckets:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
