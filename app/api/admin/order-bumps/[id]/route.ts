import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const bump = await prisma.orderBump.update({
    where: { id },
    data: {
      headline: body.headline,
      description: body.description ?? null,
      discountPct: Number(body.discountPct),
      triggerMinTotal: body.triggerMinTotal ? Number(body.triggerMinTotal) : null,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(bump)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.orderBump.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
