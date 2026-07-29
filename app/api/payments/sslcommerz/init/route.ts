import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const SSL_API = process.env.SSL_MODE === "live"
  ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
  : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"

export async function POST(req: NextRequest) {
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://novoblink.vercel.app"

  const params = new URLSearchParams({
    store_id: process.env.SSL_STORE_ID || "",
    store_passwd: process.env.SSL_STORE_PASSWORD || "",
    total_amount: String(Number(order.total)),
    currency: "BDT",
    tran_id: order.orderNumber,
    success_url: `${siteUrl}/api/payments/sslcommerz/success`,
    fail_url: `${siteUrl}/api/payments/sslcommerz/fail`,
    cancel_url: `${siteUrl}/api/payments/sslcommerz/cancel`,
    ipn_url: `${siteUrl}/api/payments/sslcommerz/ipn`,
    cus_name: order.shippingName,
    cus_email: "customer@novoblink.com",
    cus_add1: order.shippingAddress,
    cus_city: order.shippingDistrict,
    cus_state: order.shippingDivision,
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: order.shippingPhone,
    ship_name: order.shippingName,
    ship_add1: order.shippingAddress,
    ship_city: order.shippingDistrict,
    ship_state: order.shippingDivision,
    ship_postcode: "1000",
    ship_country: "Bangladesh",
    shipping_method: "Courier",
    product_name: order.items.map(i => i.productName).join(", ").slice(0, 100),
    product_category: "General",
    product_profile: "general",
    value_a: orderId,
  })

  const res = await fetch(SSL_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })
  const data = await res.json()

  if (data.status !== "SUCCESS") {
    return NextResponse.json({ error: data.failedreason || "SSLCommerz init failed" }, { status: 500 })
  }

  return NextResponse.json({ GatewayPageURL: data.GatewayPageURL })
}
