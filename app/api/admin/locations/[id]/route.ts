import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  if (body.isDefault) {
    await prisma.location.updateMany({ where: { id: { not: id } }, data: { isDefault: false } })
  }
  const location = await prisma.location.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
      isActive: body.isActive,
      isDefault: body.isDefault,
    },
  })
  return NextResponse.json(location)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.location.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
