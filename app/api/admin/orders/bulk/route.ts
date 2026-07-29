import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/auditLog"
import { sendOrderStatusUpdate } from "@/lib/email"

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids, action, status } = await req.json()
  if (!ids?.length) return NextResponse.json({ error: "No orders selected" }, { status: 400 })

  if (action === "UPDATE_STATUS") {
    if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 })

    const orders = await prisma.order.findMany({
      where: { id: { in: ids } },
      include: { user: { select: { email: true, name: true } } },
    })

    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: "order.bulk_status_update",
      entityType: "Order",
      entityId: ids.join(","),
      after: { status, count: ids.length },
    })

    // Fire-and-forget email notifications
    for (const order of orders) {
      const toEmail = order.user?.email || order.guestEmail
      if (toEmail) {
        sendOrderStatusUpdate({
          to: toEmail,
          customerName: order.user?.name || order.shippingName,
          orderNumber: order.orderNumber,
          status,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ updated: ids.length })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
