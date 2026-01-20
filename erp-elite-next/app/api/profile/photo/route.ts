import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users as user } from "@/drizzle";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        console.log("POST /api/profile/photo - start");
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            console.log("POST /api/profile/photo - Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("POST /api/profile/photo - User authenticated:", session.user.email);

        let formData;
        try {
            formData = await request.formData();
        } catch (e: any) {
            console.error("Error parsing form data:", e);
            throw new Error("Failed to parse form data: " + e.message);
        }

        const photo = formData.get("photo") as File | null;

        if (!photo) {
            console.log("POST /api/profile/photo - No photo found in body");
            return NextResponse.json({ error: "No photo uploaded" }, { status: 400 });
        }

        console.log("POST /api/profile/photo - File received:", photo.name, photo.size, photo.type);

        // Upload to storage
        console.log("POST /api/profile/photo - Starting upload...");
        const key = await storage.upload(photo, "profile-photos");
        console.log("POST /api/profile/photo - Upload complete, key:", key);

        const imageUrl = storage.url(key);

        console.log("POST /api/profile/photo - Update DB...");
        await db.update(user)
            .set({
                image: imageUrl,
                updatedAt: new Date().toISOString()
            })
            .where(eq(user.id, session.user.id));

        // If there was an old image, maybe we should delete it? 
        // For now, let's keep it simple and just overwrite the reference. 
        // Ideally we would delete: if (session.user.image) await storage.delete(session.user.image);

        return NextResponse.json({ success: true, imageUrl });

    } catch (error: any) {
        console.error("Photo upload error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.image) {
            // Delete from storage
            await storage.delete(session.user.image);

            // Remove from DB
            await db.update(user)
                .set({
                    image: null,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(user.id, session.user.id));
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Photo delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
