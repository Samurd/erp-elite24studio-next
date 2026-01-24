import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialMediaPosts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);


        const post = await db.query.socialMediaPosts.findFirst({
            where: eq(socialMediaPosts.id, id),
            with: {
                status: true,
                responsible: true,
                project: true,
            }
        });

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Fetch associated files manually like in Licenses
        const { getFilesForModel } = await import("@/actions/files");
        const associatedFiles = await getFilesForModel("App\\Models\\SocialMediaPost", id);
        (post as any).files = associatedFiles;

        return NextResponse.json({ data: post });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        await db.update(socialMediaPosts).set({
            pieceName: body.piece_name,
            mediums: body.mediums,
            contentType: body.content_type,
            scheduledDate: body.scheduled_date || null,
            projectId: body.project_id && !isNaN(parseInt(body.project_id)) ? parseInt(body.project_id) : null,
            responsibleId: body.responsible_id || null,
            statusId: parseInt(body.status_id),
            comments: body.comments,
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }).where(eq(socialMediaPosts.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating social media post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        await db.delete(socialMediaPosts).where(eq(socialMediaPosts.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
