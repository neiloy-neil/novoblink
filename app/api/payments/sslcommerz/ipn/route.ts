import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

const SSL_VALIDATE = process.env.SSL_MODE === "live"
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"

// IPN — server-to-server payment notification (fallback if redirect fails)
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const val_id = form.get("val_id") as string
  const tran_id = form.get("tran_id") as string
  const orderId = form.get("value_a") as string
  const status = form.get("status") as string

  if (status !== "VALID" && status !== "VALIDATED") {
    return NextResponse.json({ ok: false })
  }

  const validateRes = await fetch(
    `${SSL_VALIDATE}?val_id=${val_id}&store_id=${process.env.SSL_STORE_ID}&store_passwd=${process.env.SSL_STORE_PASSWORD}&format=json`
  )
  const validation = await validateRes.json()
  if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
    return NextResponse.json({ ok: false })
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order && order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        payment: {
          upsert: {
            where: { orderId },
            create: { method: "SSLCOMMERZ", status: "PAID", amount: order.total, transactionId: tran_id },
            update: { status: "PAID", transactionId: tran_id },
          },
        },
      },
    })
  }

  return NextResponse.json({ ok: true })
}
