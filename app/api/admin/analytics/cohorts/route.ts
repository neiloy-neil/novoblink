import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const topN = Number(req.nextUrl.searchParams.get("topN") || 50)

  // Customer LTV: total spend, order count, avg order value, days since last order
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      orders: {
        where: { status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const rows = customers
    .map(c => {
      const ltv = c.orders.reduce((s, o) => s + Number(o.total), 0)
      const orderCount = c.orders.length
      const avgOrderValue = orderCount ? ltv / orderCount : 0
      const lastOrder = c.orders[0]?.createdAt
      const daysSinceLastOrder = lastOrder
        ? Math.floor((Date.now() - +lastOrder) / 86400000)
        : null

      // RFM-inspired segment
      let segment = "New"
      if (orderCount >= 5 && daysSinceLastOrder !== null && daysSinceLastOrder < 60) segment = "VIP"
      else if (orderCount >= 3) segment = "Loyal"
      else if (orderCount >= 1 && daysSinceLastOrder !== null && daysSinceLastOrder > 120) segment = "At Risk"
      else if (orderCount >= 1) segment = "Active"

      return { id: c.id, name: c.name || "", email: c.email, joined: c.createdAt, ltv, orderCount, avgOrderValue, lastOrder: lastOrder || null, daysSinceLastOrder, segment }
    })
    .sort((a, b) => b.ltv - a.ltv)
    .slice(0, topN)

  const totalLTV = rows.reduce((s, r) => s + r.ltv, 0)
  const segmentCounts = rows.reduce((acc: Record<string, number>, r) => {
    acc[r.segment] = (acc[r.segment] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({ rows, totalLTV, segmentCounts })
}
