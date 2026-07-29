import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const service = await prisma.bookingService.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description ?? null,
      price: Number(body.price),
      durationMins: Number(body.durationMins),
      maxSlots: Number(body.maxSlots),
      isActive: body.isActive,
    },
  })
  return NextResponse.json(service)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.bookingService.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
