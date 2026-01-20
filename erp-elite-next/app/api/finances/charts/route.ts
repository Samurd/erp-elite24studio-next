import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invoices, payrolls, employees, tags, contacts, tagCategories } from "@/drizzle/schema"
import { eq, like, notLike, and, sql, inArray } from "drizzle-orm"

async function getInvoiceStats(relationType: string, includePattern: string, excludePattern?: string) {
    // 1. Find Tag ID for relationType (e.g. 'Cliente' or 'Proveedor') in 'tipo_relacion' category
    // This assumes specific seeding.

    // We can do a join:
    // select status_id, count(*) from invoices 
    // join contacts on invoices.contact_id = contacts.id
    // join tags as relation_tag on contacts.relation_type_id = relation_tag.id
    // join tag_categories on relation_tag.category_id = tag_categories.id
    // where tag_categories.slug = 'tipo_relacion' and relation_tag.name = relationType
    // and invoices.code like includePattern ...

    const conditions = [
        like(invoices.code, includePattern)
    ]

    if (excludePattern) {
        conditions.push(notLike(invoices.code, excludePattern))
    }

    try {
        const stats = await db
            .select({
                statusId: invoices.statusId,
                count: sql<number>`count(*)`
            })
            .from(invoices)
            .innerJoin(contacts, eq(invoices.contactId, contacts.id))
            .innerJoin(tags, eq(contacts.relationTypeId, tags.id))
            .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
            .where(
                and(
                    eq(tagCategories.slug, 'tipo_relacion'),
                    eq(tags.name, relationType),
                    ...conditions
                )
            )
            .groupBy(invoices.statusId)

        return formatStats(stats)
    } catch (e) {
        console.error(`Error getting invoice stats for ${relationType}:`, e)
        return emptyStats()
    }
}

async function getPayrollStats() {
    try {
        const stats = await db
            .select({
                statusId: payrolls.statusId,
                count: sql<number>`count(*)`
            })
            .from(payrolls)
            .groupBy(payrolls.statusId)

        return formatStats(stats)
    } catch (e) {
        console.error("Error getting payroll stats:", e)
        return emptyStats()
    }
}

async function getGenderStats() {
    try {
        const stats = await db
            .select({
                statusId: employees.genderId, // mapping genderId to statusId structure for reuse
                count: sql<number>`count(*)`
            })
            .from(employees)
            .groupBy(employees.genderId)

        return formatStats(stats)
    } catch (e) {
        console.error("Error getting gender stats:", e)
        return emptyStats()
    }
}

// Helper to format [{statusId, count}] -> {labels, data, colors}
async function formatStats(stats: { statusId: number | null, count: number }[]) {
    if (!stats.length) return emptyStats()

    const total = stats.reduce((acc, curr) => acc + Number(curr.count), 0)
    if (total === 0) return emptyStats()

    const ids = stats.map(s => s.statusId).filter(id => id !== null) as number[]
    if (ids.length === 0) return emptyStats()

    const tagList = await db.select().from(tags).where(inArray(tags.id, ids))
    const tagMap = new Map(tagList.map(t => [t.id, t]))

    const labels: string[] = []
    const data: number[] = []
    const colors: string[] = []

    for (const stat of stats) {
        if (!stat.statusId) continue
        const tag = tagMap.get(stat.statusId)
        if (tag) {
            labels.push(tag.name)
            data.push(Number(((Number(stat.count) / total) * 100).toFixed(1)))
            colors.push(tag.color || '#D1D5DB')
        }
    }

    return { labels, data, colors }
}

function emptyStats() {
    return { labels: [], data: [], colors: [] }
}

export async function GET() {
    try {
        const [
            clientInvoicesData,
            providerInvoicesData,
            billingAccountsData,
            payrollPaymentsData,
            payrollGenderData
        ] = await Promise.all([
            getInvoiceStats('Cliente', 'INV-%', 'INV-PRV-%'),
            getInvoiceStats('Proveedor', 'INV-PRV-%'),
            getInvoiceStats('Cliente', 'CC-%'),
            getPayrollStats(),
            getGenderStats()
        ])

        return NextResponse.json({
            clientInvoicesData,
            providerInvoicesData,
            billingAccountsData,
            payrollPaymentsData,
            payrollGenderData
        })
    } catch (error) {
        console.error("Error fetching charts data:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
