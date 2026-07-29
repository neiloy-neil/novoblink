import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const wf = await prisma.workflow.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      trigger: data.trigger,
      conditions: data.conditions || [],
      actions: data.actions || [],
      isActive: data.isActive ?? true,
    },
  })
  return NextResponse.json(wf)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.workflow.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
