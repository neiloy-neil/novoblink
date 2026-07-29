import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const affiliate = await prisma.affiliate.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      commissionType: data.commissionType,
      commissionValue: Number(data.commissionValue),
      isActive: data.isActive,
    },
  })
  return NextResponse.json(affiliate)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.affiliate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
