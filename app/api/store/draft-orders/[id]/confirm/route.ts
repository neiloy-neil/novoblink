import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.status !== "DRAFT") return NextResponse.json({ error: "Not a draft" }, { status: 400 })

    for (const item of order.items) {
      await prisma.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } })
    }

    await prisma.order.update({ where: { id }, data: { status: "PENDING" } })
    await prisma.orderStatusLog.create({ data: { orderId: id, status: "PENDING", note: "Customer confirmed draft order" } })
    return NextResponse.json({ success: true, orderId: id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
