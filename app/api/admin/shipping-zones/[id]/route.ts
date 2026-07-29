import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const zone = await prisma.shippingZone.update({
    where: { id },
    data: {
      name: data.name,
      districts: data.districts,
      charge: data.charge,
      freeShippingAbove: data.freeShippingAbove || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  })
  return NextResponse.json(zone)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.shippingZone.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
