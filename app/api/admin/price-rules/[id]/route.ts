import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const rule = await prisma.priceRule.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      productId: body.productId || null,
      tagName: body.tagName || null,
      minQty: body.minQty ? Number(body.minQty) : null,
      discountType: body.discountType,
      discountValue: Number(body.discountValue),
      isActive: body.isActive,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  })
  return NextResponse.json(rule)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.priceRule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
