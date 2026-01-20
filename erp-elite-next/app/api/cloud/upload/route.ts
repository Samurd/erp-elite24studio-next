import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { uploadFile } from "@/actions/files";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const folderId = formData.get("folder_id") as string;

        if (!file) {
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }

        // Add folder_id and user_id to formData
        if (folderId) {
            formData.set("folderId", folderId);
        }
        formData.set("userId", session.user.id.toString());

        const result = await uploadFile(formData);

        if (result.success) {
            return NextResponse.json({ success: true, file: result.file });
        } else {
            return NextResponse.json({ error: "Upload failed" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
