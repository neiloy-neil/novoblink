import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const card = await prisma.giftCard.update({
    where: { id },
    data: {
      isActive: data.isActive ?? undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      balance: data.balance !== undefined ? Number(data.balance) : undefined,
    },
  })
  return NextResponse.json(card)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.giftCard.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
