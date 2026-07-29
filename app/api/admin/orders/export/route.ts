import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const status = req.nextUrl.searchParams.get("status") || ""
  const from = req.nextUrl.searchParams.get("from") || ""
  const to = req.nextUrl.searchParams.get("to") || ""
  const ids = req.nextUrl.searchParams.get("ids") || ""

  const where: any = {}
  if (ids) {
    where.id = { in: ids.split(",").filter(Boolean) }
  } else {
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) { const d = new Date(to); d.setHours(23, 59, 59, 999); where.createdAt.lte = d }
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { select: { productName: true, size: true, color: true, quantity: true, price: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  const rows: string[] = [
    "orderNumber,date,customerName,customerEmail,phone,address,area,district,division,items,subtotal,shipping,discount,total,paymentMethod,paymentStatus,status,deliveryDate,note",
  ]

  for (const o of orders) {
    const itemSummary = o.items
      .map((i) => `${i.productName} (${i.size}/${i.color}) x${i.quantity}`)
      .join(" | ")
    rows.push([
      csv(o.orderNumber),
      csv(new Date(o.createdAt).toLocaleDateString("en-BD")),
      csv(o.user?.name || o.shippingName),
      csv(o.user?.email || o.guestEmail || ""),
      csv(o.shippingPhone),
      csv(o.shippingAddress),
      csv(o.shippingArea),
      csv(o.shippingDistrict),
      csv(o.shippingDivision),
      csv(itemSummary),
      csv(String(Number(o.subtotal))),
      csv(String(Number(o.shippingCharge))),
      csv(String(Number(o.discount))),
      csv(String(Number(o.total))),
      csv(o.paymentMethod),
      csv(o.paymentStatus),
      csv(o.status),
      csv(o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString("en-BD") : ""),
      csv(o.note || ""),
    ].join(","))
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function csv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}
