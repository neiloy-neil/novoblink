import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const addon = await prisma.productAddon.update({
    where: { id },
    data: {
      label: body.label,
      type: body.type,
      options: body.options,
      priceModifier: body.priceModifier,
      isRequired: body.isRequired,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(addon)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.productAddon.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
