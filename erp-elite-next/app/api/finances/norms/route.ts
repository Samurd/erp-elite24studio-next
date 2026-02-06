import { db } from "@/lib/db";
import { norms, users } from "@/drizzle/schema";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getFilesForModel } from "@/actions/files";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * pageSize;

    const conditions = [];

    if (search) {
        conditions.push(ilike(norms.name, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
        db.select({
            id: norms.id,
            name: norms.name,
            userId: norms.userId,
            createdAt: norms.createdAt,
            user: {
                name: users.name,
            }
        })
            .from(norms)
            .leftJoin(users, eq(norms.userId, users.id))
            .where(whereClause)
            .orderBy(desc(norms.createdAt))
            .limit(pageSize)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` })
            .from(norms)
            .where(whereClause)
    ]);

    const total = Number(totalResult[0]?.count || 0);
    const lastPage = Math.ceil(total / pageSize);

    // Fetch files for each norm
    // Note: getFilesForModel is a server action/function usually used for single items. 
    // For lists, it might be inefficient to call it in loop if it does separate queries.
    // However, for now we replicate the pattern. 'App\Models\Norm' is the presumed type.
    const normsWithFiles = await Promise.all(data.map(async (norm) => {
        const files = await getFilesForModel("App\\Models\\Norm", norm.id);
        return {
            ...norm,
            files: files || []
        };
    }));

    return NextResponse.json({
        data: normsWithFiles,
        meta: {
            current_page: page,
            last_page: lastPage,
            total,
            per_page: pageSize
        }
    });
}

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    try {
        const body = await request.json();

        // Simple validation
        if (!body.name) return new NextResponse("Name is required", { status: 400 });

        const [newNorm] = await db.insert(norms).values({
            name: body.name,
            userId: session.user.id,
        }).returning({ id: norms.id });

        if (newNorm?.id && body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            try {
                const { attachFileToModel } = await import("@/actions/files");
                await Promise.all(body.pending_file_ids.map((fileId: number) =>
                    attachFileToModel(fileId, "App\\Models\\Norm", newNorm.id)
                ));
            } catch (fileError) {
                console.error("Error attaching files:", fileError);
            }
        }

        return NextResponse.json(newNorm);
    } catch (error) {
        console.error("Error creating norm:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
