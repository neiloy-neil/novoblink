import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const plan = await prisma.membershipPlan.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price),
      billingCycle: body.billingCycle,
      discountPct: Number(body.discountPct),
      freeShipping: body.freeShipping,
      exclusiveAccess: body.exclusiveAccess,
      benefits: body.benefits,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(plan)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.membershipPlan.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
