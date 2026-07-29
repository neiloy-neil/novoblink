import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return ""
  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = String(v ?? "").replace(/"/g, '""')
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s
  }
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
  ].join("\r\n")
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const type = req.nextUrl.searchParams.get("type") || "orders"
  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")

  const dateFilter = from || to ? {
    createdAt: {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    },
  } : {}

  let csv = ""
  let filename = ""

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      where: dateFilter,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { productName: true, quantity: true, price: true, size: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    const rows = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString().split("T")[0],
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      customerName: o.user?.name || o.shippingName,
      customerEmail: o.user?.email || o.guestEmail || "",
      shippingName: o.shippingName,
      shippingPhone: o.shippingPhone,
      shippingDistrict: o.shippingDistrict,
      shippingDivision: o.shippingDivision,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shippingCharge: Number(o.shippingCharge),
      total: Number(o.total),
      items: o.items.map(i => `${i.productName} x${i.quantity} (${i.size}/${i.color}) @৳${Number(i.price)}`).join(" | "),
    }))
    csv = toCSV(rows)
    filename = `orders-${Date.now()}.csv`
  } else if (type === "customers") {
    const customers = await prisma.user.findMany({
      where: { role: "CUSTOMER", ...dateFilter },
      include: {
        orders: { select: { total: true, createdAt: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    const rows = customers.map(c => ({
      id: c.id,
      name: c.name || "",
      email: c.email,
      phone: c.phone || "",
      joined: c.createdAt.toISOString().split("T")[0],
      totalOrders: c._count.orders,
      ltv: c.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2),
      lastOrder: c.orders.length ? c.orders.sort((a, b) => +b.createdAt - +a.createdAt)[0].createdAt.toISOString().split("T")[0] : "",
    }))
    csv = toCSV(rows)
    filename = `customers-${Date.now()}.csv`
  } else if (type === "products") {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        variants: { select: { sku: true, size: true, color: true, stock: true, price: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    const rows = products.flatMap(p =>
      p.variants.length
        ? p.variants.map(v => ({
            productId: p.id,
            productName: p.name,
            slug: p.slug,
            category: p.category.name,
            brand: p.brand?.name || "",
            sku: v.sku,
            size: v.size,
            color: v.color,
            stock: v.stock,
            price: Number(v.price ?? p.price),
            basePrice: Number(p.price),
            totalSold: p._count.orderItems,
            isActive: p.isActive,
          }))
        : [{
            productId: p.id,
            productName: p.name,
            slug: p.slug,
            category: p.category.name,
            brand: p.brand?.name || "",
            sku: "",
            size: "",
            color: "",
            stock: 0,
            price: Number(p.price),
            basePrice: Number(p.price),
            totalSold: p._count.orderItems,
            isActive: p.isActive,
          }]
    )
    csv = toCSV(rows)
    filename = `products-${Date.now()}.csv`
  } else {
    return NextResponse.json({ error: "Invalid type. Use: orders | customers | products" }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
