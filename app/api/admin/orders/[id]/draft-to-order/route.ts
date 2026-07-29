import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  try {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.status !== "DRAFT") return NextResponse.json({ error: "Order is not a draft" }, { status: 400 })

    // Deduct inventory
    for (const item of order.items) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "PENDING" }
    })
    await prisma.orderStatusLog.create({
      data: { orderId: id, status: "PENDING", note: "Converted from draft to order" }
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
