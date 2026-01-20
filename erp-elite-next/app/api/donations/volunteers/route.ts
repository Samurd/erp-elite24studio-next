import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { volunteers, campaigns, tags } from "@/drizzle/schema";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { attachFileToModel } from "@/actions/files";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const campaignId = searchParams.get("campaign_filter");
    const statusId = searchParams.get("status_filter");
    const role = searchParams.get("role_filter");
    const city = searchParams.get("city_filter");
    const country = searchParams.get("country_filter");
    const certified = searchParams.get("certified_filter");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = parseInt(searchParams.get("per_page") || "10");
    const offset = (page - 1) * limit;

    const conditions = [];

    // Search
    if (search) {
        conditions.push(or(
            like(volunteers.name, `%${search}%`),
            like(volunteers.email, `%${search}%`),
            like(volunteers.phone, `%${search}%`)
        ));
    }

    // Filters
    if (campaignId) conditions.push(eq(volunteers.campaignId, parseInt(campaignId)));
    if (statusId) conditions.push(eq(volunteers.statusId, parseInt(statusId)));
    if (role) conditions.push(like(volunteers.role, `%${role}%`));
    if (city) conditions.push(like(volunteers.city, `%${city}%`));
    if (country) conditions.push(like(volunteers.country, `%${country}%`));
    if (certified !== null && certified !== undefined && certified !== '') {
        conditions.push(eq(volunteers.certified, parseInt(certified)));
    }

    try {
        const data = await db.query.volunteers.findMany({
            where: and(...conditions),
            with: {
                campaign: true,
                status: true,
            },
            limit: limit,
            offset: offset,
            orderBy: [desc(volunteers.createdAt)],
        });

        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(volunteers)
            .where(and(...conditions));
        const total = totalResult[0].count;

        return NextResponse.json({
            data,
            meta: {
                current_page: page,
                per_page: limit,
                total,
                last_page: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error("Error fetching volunteers:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [insertedVolunteer] = await db.insert(volunteers).values({
            name: body.name,
            email: body.email,
            phone: body.phone,
            address: body.address,
            city: body.city,
            state: body.state,
            country: body.country,
            role: body.role,
            campaignId: body.campaign_id ? parseInt(body.campaign_id) : null,
            statusId: body.status_id ? parseInt(body.status_id) : null,
            certified: body.certified ? 1 : 0,
        }).returning();

        if (body.pending_file_ids && Array.isArray(body.pending_file_ids)) {
            for (const fileId of body.pending_file_ids) {
                await attachFileToModel(fileId, "App\\Models\\Volunteer", insertedVolunteer.id);
            }
        }

        return NextResponse.json({ id: insertedVolunteer.id, message: "Volunteer created" }, { status: 201 });
    } catch (error: any) {
        if (error.code === '23505') {
            if (error.constraint === 'volunteers_email_unique') {
                return NextResponse.json({ error: "Ya existe un voluntario con ese correo electrónico" }, { status: 409 });
            }
            if (error.constraint === 'volunteers_phone_unique') {
                return NextResponse.json({ error: "Ya existe un voluntario con ese número de teléfono" }, { status: 409 });
            }
            return NextResponse.json({ error: "Ya existe un registro con esos datos (duplicado)" }, { status: 409 });
        }
        console.error("Error creating volunteer:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
