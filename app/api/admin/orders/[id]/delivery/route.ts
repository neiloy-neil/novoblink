import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { courier, consignmentId, trackingCode } = body

    const delivery = await prisma.delivery.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        courier,
        consignmentId,
        trackingCode,
        status: "PENDING"
      },
      update: {
        courier,
        consignmentId,
        trackingCode,
      }
    })

    return NextResponse.json(delivery)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
