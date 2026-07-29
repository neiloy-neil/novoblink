import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Public order lookup — no login required. Requires both order number AND
// phone number to match, so a stranger can't browse someone else's order
// just by guessing/incrementing order numbers.
export async function POST(req: Request) {
  try {
    const { orderNumber, phone } = await req.json()
    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "Order number and phone number are required" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.trim(),
        shippingPhone: phone.trim(),
      },
      include: {
        items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } } },
        delivery: true,
        statusLogs: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "No order found with that order number and phone number" }, { status: 404 })
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      depositAmount: order.depositAmount,
      depositPaid: order.depositPaid,
      createdAt: order.createdAt,
      shippingName: order.shippingName,
      shippingArea: order.shippingArea,
      shippingDistrict: order.shippingDistrict,
      items: order.items.map((i) => ({
        productName: i.productName,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        price: i.price,
        image: i.product.images[0]?.url || null,
      })),
      delivery: order.delivery
        ? { courier: order.delivery.courier, trackingCode: order.delivery.trackingCode }
        : null,
      statusLogs: order.statusLogs.map((l) => ({ status: l.status, createdAt: l.createdAt })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
