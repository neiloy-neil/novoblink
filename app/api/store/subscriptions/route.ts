import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const subs = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { plan: { include: { product: { select: { name: true, slug: true, images: { take: 1 } } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(subs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const body = await req.json()
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: body.planId } })
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  const nextOrderAt = new Date(Date.now() + plan.intervalDays * 24 * 60 * 60 * 1000)
  const sub = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      planId: body.planId,
      variantId: body.variantId || null,
      quantity: body.quantity || 1,
      nextOrderAt,
      addressId: body.addressId || null,
      paymentMethod: body.paymentMethod || "COD",
    },
  })
  return NextResponse.json(sub)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const body = await req.json()
  const sub = await prisma.subscription.update({
    where: { id: body.id, userId: session.user.id },
    data: { status: body.status },
  })
  return NextResponse.json(sub)
}
