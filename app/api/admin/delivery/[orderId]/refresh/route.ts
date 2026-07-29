import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { orderId } = await params
    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
    })

    if (!delivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    // MOCK: In a real app, this would call Pathao/Steadfast API
    // const status = await fetchCourierStatus(delivery.consignmentId)
    // For now, we'll just toggle it to IN_TRANSIT or DELIVERED to simulate an update.
    
    let newStatus = delivery.status
    if (delivery.status === "PENDING") newStatus = "PICKED_UP"
    else if (delivery.status === "PICKED_UP") newStatus = "IN_TRANSIT"
    else if (delivery.status === "IN_TRANSIT") newStatus = "DELIVERED"

    if (newStatus !== delivery.status) {
      const updated = await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: newStatus },
      })
      return NextResponse.json({ delivery: updated })
    }

    return NextResponse.json({ delivery })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
