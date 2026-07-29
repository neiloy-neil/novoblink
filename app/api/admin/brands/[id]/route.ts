import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const brand = await prisma.brand.update({
    where: { id },
    data: {
      name: body.name,
      slug: body.slug,
      logo: body.logo ?? null,
      banner: body.banner ?? null,
      description: body.description ?? null,
      website: body.website ?? null,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(brand)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.brand.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
