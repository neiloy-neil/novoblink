import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { trackParcel } from "@/lib/pathao"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const delivery = await prisma.delivery.findUnique({
      where: { orderId }
    })

    if (!delivery || !delivery.consignmentId) {
      return NextResponse.json({ error: "Delivery not found or missing consignment ID" }, { status: 404 })
    }

    const pathaoData = await trackParcel(delivery.consignmentId)
    
    // Map Pathao status to our DeliveryStatus enum
    // Pathao statuses usually are: Pending, Picked, Transit, Delivered, Return, etc.
    let newStatus = delivery.status
    const pStatus = (pathaoData.order_status || "").toUpperCase()
    
    if (pStatus.includes("DELIVERED")) newStatus = "DELIVERED"
    else if (pStatus.includes("TRANSIT")) newStatus = "IN_TRANSIT"
    else if (pStatus.includes("RETURN")) newStatus = "RETURNED"
    else if (pStatus.includes("FAIL")) newStatus = "FAILED"
    else if (pStatus.includes("PICK")) newStatus = "PICKED_UP"

    if (newStatus !== delivery.status) {
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: newStatus }
      })
      
      if (newStatus === "DELIVERED") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "DELIVERED" }
        })
      } else if (newStatus === "RETURNED") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "RETURNED" }
        })
      }
    }

    return NextResponse.json({ status: newStatus, pathaoDetails: pathaoData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
