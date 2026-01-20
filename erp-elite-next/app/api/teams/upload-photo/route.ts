
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { storage } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        const key = await storage.upload(file, "team-photos");
        const url = storage.url(key);

        return NextResponse.json({ success: true, url });
    } catch (error: any) {
        console.error("Team photo upload error:", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
