import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { queryPayment } from "@/lib/bkash"
import { awardPoints } from "@/lib/loyalty"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { paymentID, orderId } = await req.json()

    if (!paymentID || !orderId) {
      return NextResponse.json({ error: "paymentID and orderId are required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    // Verify the caller owns this order (or is admin)
    const session = await auth()
    if (!order || (order.userId && order.userId !== session?.user?.id && session?.user?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const bkashData = await queryPayment(paymentID)

    if (bkashData.transactionStatus === "Completed" && order.paymentStatus !== "PAID") {
      // Update if not already updated
      await prisma.payment.update({
        where: { orderId: orderId },
        data: {
          status: "PAID",
          transactionId: bkashData.trxID,
          paidAt: new Date(),
          gatewayResponse: bkashData,
        }
      })

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        }
      })

      if (order.userId) {
        try {
          await awardPoints(order.userId, orderId, Number(order.total))
        } catch (err) {
          console.error("Failed to award points", err)
        }
      }
    }

    return NextResponse.json(bkashData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
