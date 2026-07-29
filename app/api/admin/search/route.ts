import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const [orders, products, customers] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: "insensitive" } },
          { shippingName: { contains: q, mode: "insensitive" } },
          { shippingPhone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: { id: true, orderNumber: true, shippingName: true, total: true, status: true },
    }).catch(() => []),
    prisma.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 4,
      select: { id: true, name: true, isActive: true },
    }).catch(() => []),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
        role: "CUSTOMER",
      },
      take: 4,
      select: { id: true, name: true, email: true, phone: true },
    }).catch(() => []),
  ])

  const results = [
    ...orders.map((o) => ({
      type: "order" as const,
      id: o.id,
      label: o.orderNumber,
      sub: `${o.shippingName} · ৳${Number(o.total).toLocaleString()} · ${o.status}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...products.map((p) => ({
      type: "product" as const,
      id: p.id,
      label: p.name,
      sub: p.isActive ? "Active" : "Inactive",
      href: `/admin/products/${p.id}`,
    })),
    ...customers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      label: c.name || c.email || "Unknown",
      sub: c.email || c.phone || "",
      href: `/admin/customers`,
    })),
  ]

  return NextResponse.json({ results })
}
