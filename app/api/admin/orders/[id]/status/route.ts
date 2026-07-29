import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendOrderStatusUpdate, sendShippingDispatched } from "@/lib/email"
import { sendSms, smsTemplates } from "@/lib/sms"
import { runWorkflows } from "@/lib/workflowEngine"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { status, paymentStatus } = body

    const VALID_STATUSES = ["PENDING","CONFIRMED","PACKED","SHIPPED","DELIVERED","CANCELLED","RETURNED"]
    const VALID_PAYMENT_STATUSES = ["UNPAID","PARTIAL","PAID","REFUNDED"]
    // Prevent rewinding past terminal states
    const TERMINAL = ["DELIVERED", "CANCELLED", "RETURNED"]

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
      }
      const current = await prisma.order.findUnique({ where: { id }, select: { status: true } })
      if (current && TERMINAL.includes(current.status) && current.status !== status) {
        return NextResponse.json({ error: `Cannot change status from ${current.status}` }, { status: 400 })
      }
    }
    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return NextResponse.json({ error: `Invalid payment status: ${paymentStatus}` }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus
      updateData.payment = {
        update: { status: paymentStatus }
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { user: { select: { email: true, name: true } } },
    })

    if (status) {
      await prisma.orderStatusLog.create({
        data: { orderId: id, status, note: `Status updated to ${status} via Admin Panel` },
      })

      // Email notification (fire-and-forget)
      const toEmail = order.user?.email || order.guestEmail
      const customerName = order.user?.name || order.shippingName
      if (toEmail) {
        if (status === "SHIPPED") {
          sendShippingDispatched({
            to: toEmail,
            customerName: customerName || "Customer",
            orderNumber: order.orderNumber,
            courierName: body.courierName || "Our courier",
            trackingNumber: body.trackingNumber || "",
            trackingUrl: body.trackingUrl,
          }).catch(() => {})
        } else if (["CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED"].includes(status)) {
          sendOrderStatusUpdate({
            to: toEmail,
            customerName: customerName || "Customer",
            orderNumber: order.orderNumber,
            status,
            note: body.note,
          }).catch(() => {})
        }
      }
    }

    // SMS notifications
    if (status && order.shippingPhone) {
      if (status === "SHIPPED") {
        sendSms(order.shippingPhone, smsTemplates.orderShipped(order.orderNumber, body.trackingNumber || ""), "order_shipped").catch(() => {})
      } else if (status === "DELIVERED") {
        sendSms(order.shippingPhone, smsTemplates.orderDelivered(order.orderNumber), "order_delivered").catch(() => {})
      } else if (status === "CANCELLED") {
        sendSms(order.shippingPhone, smsTemplates.orderCancelled(order.orderNumber), "order_cancelled").catch(() => {})
      }
    }

    // Workflow engine: ORDER_STATUS_CHANGED (fire-and-forget)
    if (status) {
      runWorkflows("ORDER_STATUS_CHANGED", { orderId: id, status, previousStatus: order.status }).catch(() => {})
    }

    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
