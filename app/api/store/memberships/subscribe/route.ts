import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const { planId } = await req.json()

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })

  // cancel existing active subscription if any
  await prisma.membershipSubscription.updateMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  })

  const expiresAt = plan.billingCycle === "LIFETIME"
    ? null
    : new Date(Date.now() + (plan.billingCycle === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000)

  const sub = await prisma.membershipSubscription.create({
    data: {
      userId: session.user.id,
      planId,
      status: "ACTIVE",
      expiresAt,
    },
  })
  return NextResponse.json(sub)
}
