import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const body = await req.json()
    const { orderId, items, reason, note } = body

    if (!orderId || !items?.length || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify order belongs to user (or is a guest order)
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (session && order.userId && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (!["DELIVERED"].includes(order.status)) {
      return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 400 })
    }

    // Check no existing pending/approved return
    const existing = await prisma.returnRequest.findFirst({
      where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
    })
    if (existing) return NextResponse.json({ error: "A return request already exists for this order" }, { status: 409 })

    const returnReq = await prisma.returnRequest.create({
      data: {
        orderId,
        userId: session?.user.id || null,
        reason,
        note: note || null,
        status: "PENDING",
        items: {
          create: items.map((i: { orderItemId: string; quantity: number }) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ id: returnReq.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
