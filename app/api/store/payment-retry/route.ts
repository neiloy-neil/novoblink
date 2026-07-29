import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { orderId } = await req.json()
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    // Only the owner or guest (by matching order) can retry
    if (session && order.userId && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 })
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot retry payment for a cancelled order" }, { status: 400 })
    }

    // Reset payment record so gateway can create a fresh session
    if (order.payment) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: "UNPAID", transactionId: null, paidAt: null },
      })
    }

    // Return the order ID — the client will call the appropriate gateway
    return NextResponse.json({ orderId: order.id, paymentMethod: order.paymentMethod, total: Number(order.total) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
