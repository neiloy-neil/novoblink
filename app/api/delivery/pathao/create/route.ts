import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createParcel } from "@/lib/pathao"

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Call Pathao API
    const result = await createParcel(order)

    // Save Delivery record
    const delivery = await prisma.delivery.upsert({
      where: { orderId },
      create: {
        orderId,
        courier: "PATHAO",
        status: "PICKED_UP", // Initial status from Pathao might be pending/picked up
        consignmentId: result.consignment_id,
        trackingCode: result.tracking_code,
      },
      update: {
        courier: "PATHAO",
        consignmentId: result.consignment_id,
        trackingCode: result.tracking_code,
        status: "PICKED_UP"
      }
    })

    // Update order status to PACKED or SHIPPED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "PACKED" }
    })

    await prisma.orderStatusLog.create({
      data: {
        orderId,
        status: "PACKED",
        note: `Parcel created in Pathao. Consignment ID: ${result.consignment_id}`
      }
    })

    return NextResponse.json(delivery)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
