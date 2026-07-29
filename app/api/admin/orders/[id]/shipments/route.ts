import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/auditLog"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shipments = await prisma.orderShipment.findMany({
    where: { orderId: id },
    include: { items: { include: { orderItem: { select: { productName: true, size: true, color: true, quantity: true } } } } },
    orderBy: { shipmentNumber: "asc" },
  })
  return NextResponse.json(shipments)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { courier, note, items } = await req.json()

  const count = await prisma.orderShipment.count({ where: { orderId: id } })

  const shipment = await prisma.orderShipment.create({
    data: {
      orderId: id,
      shipmentNumber: count + 1,
      courier: courier || "SELF",
      note: note || null,
      status: "PENDING",
      items: {
        create: (items || []).map((i: { orderItemId: string; quantity: number }) => ({
          orderItemId: i.orderItemId,
          quantity: i.quantity,
        })),
      },
    },
    include: { items: true },
  })

  await logAudit({ actorId: session.user.id, actorEmail: session.user.email, actorRole: session.user.role, action: "order.shipment_created", entityType: "Order", entityId: id, after: { shipmentNumber: shipment.shipmentNumber, courier } })

  return NextResponse.json(shipment)
}
