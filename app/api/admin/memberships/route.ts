import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const plans = await prisma.membershipPlan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const plan = await prisma.membershipPlan.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      price: Number(body.price),
      billingCycle: body.billingCycle || "MONTHLY",
      discountPct: Number(body.discountPct) || 0,
      freeShipping: body.freeShipping || false,
      exclusiveAccess: body.exclusiveAccess || false,
      benefits: body.benefits || [],
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder || 0,
    },
  })
  return NextResponse.json(plan)
}
