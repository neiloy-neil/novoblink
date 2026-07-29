import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const orderId = req.nextUrl.searchParams.get("orderId")
  const labels = await prisma.shippingLabel.findMany({
    where: orderId ? { orderId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(labels)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()

  const order = await prisma.order.findUnique({
    where: { id: body.orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  // Auto-submit to Pathao or Steadfast if credentials configured
  let consignmentId: string | null = null
  let apiResponse: any = null

  if (body.courier === "STEADFAST") {
    const apiKey = process.env.STEADFAST_API_KEY
    const secretKey = process.env.STEADFAST_SECRET_KEY
    if (apiKey && secretKey) {
      try {
        const res = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
          method: "POST",
          headers: {
            "Api-Key": apiKey,
            "Secret-Key": secretKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoice: order.orderNumber,
            recipient_name: order.shippingName,
            recipient_phone: order.shippingPhone,
            recipient_address: `${order.shippingAddress}, ${order.shippingArea}, ${order.shippingDistrict}`,
            cod_amount: order.paymentMethod === "COD" ? Number(order.total) : 0,
            note: order.note || "",
          }),
        })
        apiResponse = await res.json()
        consignmentId = apiResponse?.consignment?.consignment_id?.toString() || null
      } catch {
        // proceed without auto-submit
      }
    }
  }

  const label = await prisma.shippingLabel.upsert({
    where: { orderId: body.orderId },
    create: {
      orderId: body.orderId,
      courier: body.courier,
      consignmentId,
      status: consignmentId ? "SUBMITTED" : "PENDING",
      apiResponse: apiResponse || undefined,
    },
    update: {
      courier: body.courier,
      consignmentId,
      status: consignmentId ? "SUBMITTED" : "PENDING",
      apiResponse: apiResponse || undefined,
    },
  })

  return NextResponse.json(label)
}
