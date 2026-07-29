import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const qa = await prisma.reviewQA.update({
    where: { id },
    data: {
      answer: body.answer,
      isPublished: body.isPublished,
      answeredAt: body.answer ? new Date() : null,
    },
  })
  return NextResponse.json(qa)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.reviewQA.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
