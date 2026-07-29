import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get("productId")

  // Recent purchases — last 10 orders with product names
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000)
  const recentOrders = await prisma.orderItem.findMany({
    where: {
      ...(productId ? { productId } : {}),
      order: { createdAt: { gte: since }, status: { notIn: ["CANCELLED"] } },
    },
    include: { order: { select: { shippingName: true, shippingDistrict: true, createdAt: true } } },
    orderBy: { order: { createdAt: "desc" } },
    take: 15,
  })

  const events = recentOrders.map(item => ({
    name: maskName(item.order.shippingName),
    district: item.order.shippingDistrict,
    productName: item.productName,
    minutesAgo: Math.floor((Date.now() - new Date(item.order.createdAt).getTime()) / 60000),
  }))

  // Sold today count (for the specific product)
  let soldToday = 0
  if (productId) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const agg = await prisma.orderItem.aggregate({
      where: { productId, order: { createdAt: { gte: todayStart }, status: { notIn: ["CANCELLED"] } } },
      _sum: { quantity: true },
    })
    soldToday = agg._sum.quantity || 0
  }

  return NextResponse.json({ events, soldToday })
}

function maskName(name: string): string {
  const parts = name.trim().split(" ")
  return parts.map((p, i) => i === 0 ? p : p[0] + "***").join(" ")
}
