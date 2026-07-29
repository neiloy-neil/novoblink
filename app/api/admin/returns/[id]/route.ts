import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/auditLog"
import { sendReturnUpdate } from "@/lib/email"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { status, adminNote, refundAmount } = await req.json()

  // Fetch current state so we can detect a transition to REFUNDED
  const current = await prisma.returnRequest.findUnique({
    where: { id },
    select: { status: true, userId: true, orderId: true },
  })
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.returnRequest.update({
    where: { id },
    data: { status, adminNote: adminNote || null, refundAmount: refundAmount ? Number(refundAmount) : null },
    include: { order: { include: { user: { select: { email: true, name: true } } } } },
  })

  // Auto-issue store credit when transitioning into REFUNDED
  if (status === "REFUNDED" && current.status !== "REFUNDED" && current.userId && refundAmount) {
    const amount = Number(refundAmount)
    if (amount > 0) {
      await prisma.$transaction([
        prisma.storeCredit.upsert({
          where: { userId: current.userId },
          create: { userId: current.userId, balance: amount },
          update: { balance: { increment: amount } },
        }),
        prisma.storeCreditTransaction.create({
          data: {
            userId: current.userId,
            amount,
            type: "CREDIT",
            reason: `Refund for return on order #${updated.order.orderNumber}`,
            orderId: current.orderId,
            issuedBy: session.user.id,
          },
        }),
      ])
    }
  }

  await logAudit({
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorRole: session.user.role,
    action: "return.status_changed",
    entityType: "ReturnRequest",
    entityId: id,
    after: { status, adminNote, refundAmount },
  })

  const toEmail = updated.order.user?.email || updated.order.guestEmail
  if (toEmail) {
    sendReturnUpdate({
      to: toEmail,
      customerName: updated.order.user?.name || updated.order.shippingName,
      orderNumber: updated.order.orderNumber,
      status,
      refundAmount: refundAmount ? Number(refundAmount) : undefined,
      adminNote: adminNote || null,
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
