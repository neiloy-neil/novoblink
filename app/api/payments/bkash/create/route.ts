import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createPayment } from "@/lib/bkash"

export async function POST(req: Request) {
  try {
    const { orderId, type } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const isDeposit = type === "deposit"

    if (isDeposit) {
      if (Number(order.depositAmount) <= 0) {
        return NextResponse.json({ error: "No deposit required for this order" }, { status: 400 })
      }
      if (order.depositPaid) {
        return NextResponse.json({ error: "Deposit already paid" }, { status: 400 })
      }
    } else if (order.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "Order is already paid or processing" }, { status: 400 })
    }

    // Amount needs to be converted if Decimal
    const amount = isDeposit ? Number(order.depositAmount) : Number(order.total)

    // Call bKash Create API
    const { bkashURL, paymentID } = await createPayment(amount, orderId)

    // Save payment ID to Payment record
    await prisma.payment.upsert({
      where: { orderId: orderId },
      create: {
        orderId,
        method: "BKASH",
        status: "UNPAID",
        amount,
        gatewayResponse: { paymentID, isDeposit }
      },
      update: {
        amount,
        gatewayResponse: { paymentID, isDeposit },
        status: "UNPAID",
      }
    })

    return NextResponse.json({ bkashURL })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
