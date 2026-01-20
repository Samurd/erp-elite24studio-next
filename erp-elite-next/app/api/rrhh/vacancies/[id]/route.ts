import { db } from "@/lib/db";
import { vacancies } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { DateService } from "@/lib/date-service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Fix for Next.js 15 params
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        const vacancy = await db.query.vacancies.findFirst({
            where: eq(vacancies.id, id),
            with: {
                contractType: true,
                status: true,
                user: true
            }
        });

        if (!vacancy) {
            return new NextResponse("Vacancy not found", { status: 404 });
        }

        return NextResponse.json({
            ...vacancy,
            contract_type_id: vacancy.contractTypeId,
            status_id: vacancy.statusId,
            user_id: vacancy.userId,
            published_at: vacancy.publishedAt
        });
    } catch (error) {
        console.error("Error fetching vacancy:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        const body = await request.json();

        // Safe parsing to prevent NaN values
        const safeParseInt = (val: any) => {
            if (!val) return null;
            const parsed = parseInt(val);
            return isNaN(parsed) ? null : parsed;
        };

        await db.update(vacancies)
            .set({
                title: body.title,
                area: body.area,
                contractTypeId: safeParseInt(body.contract_type_id),
                publishedAt: body.published_at ? DateService.toDB(new Date(body.published_at)) : null,
                statusId: safeParseInt(body.status_id),
                userId: safeParseInt(body.user_id),
                description: body.description,
                updatedAt: DateService.toISO(new Date()).slice(0, 19).replace('T', ' '),
            })
            .where(eq(vacancies.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating vacancy:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        await db.delete(vacancies).where(eq(vacancies.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting vacancy:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
