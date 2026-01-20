import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
    calendarEvents,
    licenses,
    policies,
    certificates,
    projects,
    tags
} from "@/drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const events = [];

    try {
        // 1. Personal Calendar Events
        const personalEvents = await db.select()
            .from(calendarEvents)
            .where(eq(calendarEvents.userId, userId));

        for (const event of personalEvents) {
            events.push({
                id: event.id,
                title: event.title,
                start: event.startDate,
                end: event.endDate,
                allDay: event.isAllDay === 1,
                color: event.color,
                extendedProps: {
                    type: 'Personal',
                    eventId: event.id,
                    description: event.description,
                    isPersonal: true
                }
            });
        }

        // 2. Licenses (where user is responsible is not explicitly in schema, assuming all visible or filtered by logic if needed)
        // For now fetching all licenses to replicate general visibility, or could filter by project assignment if needed.
        // The Laravel controller filtered generally, let's fetch active ones.
        const licensesData = await db.query.licenses.findMany({
            with: {
                licenseType: true,
                status: true,
                project: true,
            }
        });

        for (const license of licensesData) {
            if (license.expirationDate) {
                events.push({
                    title: `📄 ${license.licenseType?.name || 'Licencia'} - ${license.project?.name || ''}`,
                    start: license.expirationDate,
                    allDay: true,
                    color: license.status?.color || '#fbbf24', // Amber
                    extendedProps: {
                        type: 'License',
                        description: license.observations || '',
                        status: license.status?.name || 'N/A',
                        project: license.project?.name || 'N/A',
                        entity: license.entity,
                        company: license.company,
                        eradicatedNumber: license.eradicatedNumber,
                    }
                });
            }
        }

        // 3. Certificates (Assigned to user)
        const certificatesData = await db.query.certificates.findMany({
            where: eq(certificates.assignedToId, userId),
            with: {
                type: true,
                status: true,
            }
        });

        for (const cert of certificatesData) {
            if (cert.issuedAt) {
                events.push({
                    title: `📜 ${cert.name} (Emitido)`,
                    start: cert.issuedAt,
                    allDay: true,
                    color: '#a855f7', // Purple
                    extendedProps: {
                        type: 'Certificate',
                        description: cert.description || '',
                        certificateType: cert.type?.name || 'N/A',
                        status: cert.status?.name || 'N/A'
                    }
                });
            }
            if (cert.expiresAt) {
                events.push({
                    title: `⚠️ ${cert.name} (Vence)`,
                    start: cert.expiresAt,
                    allDay: true,
                    color: '#f97316', // Orange
                    extendedProps: {
                        type: 'Certificate Expiry',
                        description: cert.description || '',
                        certificateType: cert.type?.name || 'N/A',
                        status: cert.status?.name || 'N/A'
                    }
                });
            }
        }

        // 4. Policies (Assigned to user)
        const policiesData = await db.query.policies.findMany({
            where: eq(policies.assignedToId, userId),
            with: {
                type: true,
                status: true,
            }
        });

        for (const policy of policiesData) {
            if (policy.issuedAt) {
                events.push({
                    title: `📋 ${policy.name} (Emitida)`,
                    start: policy.issuedAt,
                    allDay: true,
                    color: '#84cc16', // Lime
                    extendedProps: {
                        type: 'Policy',
                        description: policy.description || '',
                        policyType: policy.type?.name || 'N/A',
                        status: policy.status?.name || 'N/A'
                    }
                });
            }
            if (policy.expirationDate) {
                events.push({
                    title: `⚠️ ${policy.name} (Vence)`,
                    start: policy.expirationDate,
                    allDay: true,
                    color: '#ef4444', // Red
                    extendedProps: {
                        type: 'Policy Expiry',
                        description: policy.description || '',
                        policyType: policy.type?.name || 'N/A',
                        status: policy.status?.name || 'N/A'
                    }
                });
            }
        }

        // 5. Projects (Responsible)
        const projectsData = await db.query.projects.findMany({
            where: eq(projects.responsibleId, userId),
            with: {
                tag_statusId: true
            }
        });

        for (const project of projectsData) {
            if (project.createdAt) {
                events.push({
                    title: `🚀 ${project.name}`,
                    start: project.createdAt.split('T')[0], // Assuming ISO string
                    allDay: true,
                    color: '#f59e0b', // Amber-500
                    extendedProps: {
                        type: 'Project',
                        description: project.description || '',
                        status: project.tag_statusId?.name || 'N/A'
                    }
                });
            }
        }

        return NextResponse.json(events);
    } catch (error: any) {
        console.error("Error fetching calendar events:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        const body = await req.json();

        // Basic validation
        if (!body.title || !body.start) {
            return NextResponse.json({ error: "Title and start date are required" }, { status: 400 });
        }

        const result = await db.insert(calendarEvents).values({
            userId: userId,
            title: body.title,
            description: body.description,
            startDate: body.start, // Pass ISO string directly, Postgres handles it
            endDate: body.end || null,
            isAllDay: body.is_all_day ? 1 : 0,
            color: body.color || '#3b82f6',
        }).returning({ id: calendarEvents.id });

        return NextResponse.json({ id: result[0].id, message: "Event created" }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
