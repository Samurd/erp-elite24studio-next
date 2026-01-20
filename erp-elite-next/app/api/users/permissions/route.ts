import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions, areas } from "@/drizzle";
import { eq, aliasedTable } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parentArea = aliasedTable(areas, "parentArea");

        const permissionsData = await db
            .select({
                id: permissions.id,
                name: permissions.name,
                action: permissions.action,
                area_id: permissions.areaId,
                area: {
                    id: areas.id,
                    name: areas.name,
                    parent_id: areas.parentId,
                    parent: {
                        id: parentArea.id,
                        name: parentArea.name,
                    }
                }
            })
            .from(permissions)
            .leftJoin(areas, eq(permissions.areaId, areas.id))
            .leftJoin(parentArea, eq(areas.parentId, parentArea.id));

        return Response.json(permissionsData);

    } catch (error) {
        console.error("Error fetching permissions:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
