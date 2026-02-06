import { db } from "@/lib/db";
import { norms, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getFilesForModel } from "@/actions/files";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parseInt((await params).id);

    try {
        const [norm] = await db.select({
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
            .where(eq(norms.id, id));

        if (!norm) return new NextResponse("Not Found", { status: 404 });

        const files = await getFilesForModel("App\\Models\\Norm", norm.id);

        return NextResponse.json({
            ...norm,
            files: files || []
        });

    } catch (error) {
        console.error("Error fetching norm:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parseInt((await params).id);

    try {
        const body = await request.json();

        if (!body.name) return new NextResponse("Name is required", { status: 400 });

        await db.update(norms)
            .set({
                name: body.name,
                updatedAt: new Date().toISOString(), // Drizzle usually handles updatedAt automatically if configured, but explicit is safe
            })
            .where(eq(norms.id, id));

        if (id && body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            try {
                const { attachFileToModel } = await import("@/actions/files");
                await Promise.all(body.pending_file_ids.map((fileId: number) =>
                    attachFileToModel(fileId, "App\\Models\\Norm", id)
                ));
            } catch (fileError) {
                console.error("Error attaching files:", fileError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating norm:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const id = parseInt((await params).id);

    try {
        await db.delete(norms).where(eq(norms.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting norm:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
