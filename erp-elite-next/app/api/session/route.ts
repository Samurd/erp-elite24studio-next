import { auth, getUserWithPermissions } from "@/lib/auth";
import { headers } from "next/headers";
import { storage } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ user: null, role: null, permissions: [] }, { status: 401 });
        }

        // Get permissions from database
        const userData = await getUserWithPermissions(session.user.id);

        if (!userData?.user) {
            return Response.json({ user: null, role: null, permissions: [] }, { status: 401 });
        }

        return new Response(JSON.stringify({
            user: {
                id: userData.user.id,
                name: userData.user.name,
                email: userData.user.email,
                image: userData.user.image ? storage.url(userData.user.image) : null,
            },
            role: userData.roles[0]?.name || null,
            roleName: userData.primaryRole,
            permissions: userData.permissions
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });

    } catch (error) {
        console.error("Session error:", error);
        return Response.json({ user: null, role: null, permissions: [] }, { status: 500 });
    }
}
