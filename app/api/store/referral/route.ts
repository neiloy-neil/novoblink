import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(req: Request) {
  const limited = await rateLimit(req, "referral")
  if (limited) return limited
  try {
    // Must be authenticated — no anonymous referral claims
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 })
    }

    const { referralCode, orderId } = await req.json()
    if (!referralCode || !orderId) return NextResponse.json({ ok: false })

    const affiliate = await prisma.affiliate.findFirst({ where: { code: referralCode } })
    if (!affiliate || !affiliate.userId) return NextResponse.json({ ok: false })

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, id: true },
    })

    // Order must belong to the authenticated user
    if (!order?.userId || order.userId !== session.user.id) {
      return NextResponse.json({ ok: false, reason: "order_not_found" })
    }

    // Idempotency: check if a referral credit was already issued for this order
    const alreadyClaimed = await prisma.storeCreditTransaction.findFirst({
      where: { userId: order.userId, reason: { contains: `referral:${orderId}` } },
    })
    if (alreadyClaimed) return NextResponse.json({ ok: false, reason: "already_claimed" })

    // Only first DELIVERED or CONFIRMED order qualifies (cancelled/pending don't count)
    const prevOrders = await prisma.order.count({
      where: {
        userId: order.userId,
        id: { not: orderId },
        status: { in: ["DELIVERED", "CONFIRMED", "PACKED", "SHIPPED"] },
      },
    })
    if (prevOrders > 0) return NextResponse.json({ ok: false, reason: "not_first_order" })

    if (affiliate.userId === order.userId) return NextResponse.json({ ok: false, reason: "self_referral" })

    const REWARD = 100
    const idempotencyKey = `referral:${orderId}`

    await prisma.$transaction([
      prisma.storeCredit.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId, balance: REWARD },
        update: { balance: { increment: REWARD } },
      }),
      prisma.storeCreditTransaction.create({
        data: { userId: order.userId, amount: REWARD, type: "CREDIT", reason: `Referral welcome bonus — ${idempotencyKey}` },
      }),
      prisma.storeCredit.upsert({
        where: { userId: affiliate.userId },
        create: { userId: affiliate.userId, balance: REWARD },
        update: { balance: { increment: REWARD } },
      }),
      prisma.storeCreditTransaction.create({
        data: { userId: affiliate.userId, amount: REWARD, type: "CREDIT", reason: `Referral reward — ${idempotencyKey}` },
      }),
    ])

    return NextResponse.json({ ok: true, reward: REWARD })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
