import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendAbandonedCartEmail } from "@/lib/email"

// Vercel Cron: runs every 30 minutes (configure in vercel.json)
// GET /api/cron/abandoned-cart
// Secured by CRON_SECRET header

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Email 1: 1 hour after abandonment — send if not yet sent and cart is 1h+ old
  const email1Threshold = new Date(now.getTime() - 60 * 60 * 1000)
  // Email 2: 24 hours after abandonment
  const email2Threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  // Email 3: 72 hours after abandonment
  const email3Threshold = new Date(now.getTime() - 72 * 60 * 60 * 1000)

  const carts = await prisma.abandonedCart.findMany({
    where: {
      email: { not: null },
      isRecovered: false,
      OR: [
        // Eligible for email 1
        { email1SentAt: null, createdAt: { lte: email1Threshold } },
        // Eligible for email 2
        { email1SentAt: { not: null }, email2SentAt: null, createdAt: { lte: email2Threshold } },
        // Eligible for email 3
        { email2SentAt: { not: null }, email3SentAt: null, createdAt: { lte: email3Threshold } },
      ],
    },
  })

  let sent = 0
  let failed = 0

  for (const cart of carts) {
    if (!cart.email) continue
    const items = cart.items as any[]
    if (!items?.length) continue

    let sequence: 1 | 2 | 3
    let updateField: Record<string, Date>

    if (!cart.email1SentAt && cart.createdAt <= email1Threshold) {
      sequence = 1
      updateField = { email1SentAt: now }
    } else if (cart.email1SentAt && !cart.email2SentAt && cart.createdAt <= email2Threshold) {
      sequence = 2
      updateField = { email2SentAt: now }
    } else if (cart.email2SentAt && !cart.email3SentAt && cart.createdAt <= email3Threshold) {
      sequence = 3
      updateField = { email3SentAt: now }
    } else {
      continue
    }

    try {
      await sendAbandonedCartEmail({
        to: cart.email,
        customerName: cart.name,
        items: items.map((i: any) => ({
          name: i.name,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        subtotal: Number(cart.subtotal),
        sequence,
        couponCode: sequence === 2 ? cart.couponCode : null,
      })
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { ...updateField, emailSent: true, emailSentAt: updateField[Object.keys(updateField)[0]] },
      })
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, checked: carts.length })
}
