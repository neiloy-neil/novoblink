import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { initializePayment, completePayment } from "@/lib/nagad"

export async function POST(req: Request) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1"

    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "Order is already paid or processing" }, { status: 400 })
    }

    const amount = Number(order.total)
    
    // Call Nagad Initialize API
    const initData = await initializePayment(orderId, amount, clientIp)

    // Call Nagad Complete API to get the redirect URL
    const nagadURL = await completePayment(initData.paymentReferenceId, orderId, amount, initData.challenge, clientIp)

    // Save payment ID to Payment record
    await prisma.payment.upsert({
      where: { orderId: orderId },
      create: {
        orderId,
        method: "NAGAD",
        status: "UNPAID",
        amount: order.total,
        gatewayResponse: { paymentReferenceId: initData.paymentReferenceId }
      },
      update: {
        gatewayResponse: { paymentReferenceId: initData.paymentReferenceId },
        status: "UNPAID",
      }
    })

    return NextResponse.json({ nagadURL })
  } catch (error: any) {
    console.error("Nagad create error", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
