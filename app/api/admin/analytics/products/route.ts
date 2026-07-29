import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const days = Number(req.nextUrl.searchParams.get("days") || 30)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Top products by revenue
  const topByRevenue = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
    _sum: { price: true, quantity: true },
    _count: { id: true },
    orderBy: { _sum: { price: "desc" } },
    take: 20,
  })

  const productIds = topByRevenue.map(r => r.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true, images: { take: 1 } },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  // Product views
  const views = await prisma.productView.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds }, createdAt: { gte: since } },
    _count: { id: true },
  })
  const viewMap = Object.fromEntries(views.map(v => [v.productId, v._count.id]))

  const rows = topByRevenue.map(r => ({
    product: productMap[r.productId] || { id: r.productId, name: "Unknown", slug: "" },
    revenue: Number(r._sum.price || 0),
    unitsSold: r._sum.quantity || 0,
    orders: r._count.id,
    views: viewMap[r.productId] || 0,
    conversionRate: viewMap[r.productId]
      ? ((r._count.id / viewMap[r.productId]) * 100).toFixed(1) + "%"
      : "—",
  }))

  return NextResponse.json({ rows, period: `last ${days} days` })
}
