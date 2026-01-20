import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns, volunteers, tags, tagCategories, users } from "@/drizzle/schema";
import { desc, sql, isNotNull, eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        // Campaigns
        const campaignsList = await db.query.campaigns.findMany({
            columns: { id: true, name: true },
            orderBy: [desc(campaigns.createdAt)],
        });

        // Status Options (estado_voluntario)
        let statusOptions: any[] = [];
        const statusCategory = await db.query.tagCategories.findFirst({
            where: eq(tagCategories.slug, "estado_voluntario"),
        });

        if (statusCategory) {
            statusOptions = await db.query.tags.findMany({
                where: eq(tags.categoryId, statusCategory.id),
                columns: { id: true, name: true, color: true },
            });
        }

        // Distinct Roles
        const roleResults = await db.selectDistinct({ role: volunteers.role })
            .from(volunteers)
            .where(isNotNull(volunteers.role))
            .orderBy(volunteers.role);
        const roles = roleResults.map(r => r.role).filter(Boolean);

        // Distinct Cities
        const cityResults = await db.selectDistinct({ city: volunteers.city })
            .from(volunteers)
            .where(isNotNull(volunteers.city))
            .orderBy(volunteers.city);
        const cities = cityResults.map(r => r.city).filter(Boolean);

        // Distinct Countries
        const countryResults = await db.selectDistinct({ country: volunteers.country })
            .from(volunteers)
            .where(isNotNull(volunteers.country))
            .orderBy(volunteers.country);
        const countries = countryResults.map(r => r.country).filter(Boolean);

        return NextResponse.json({
            campaigns: campaignsList,
            statusOptions,
            roles,
            cities,
            countries
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
