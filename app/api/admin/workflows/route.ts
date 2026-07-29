import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const workflows = await prisma.workflow.findMany({
    include: { _count: { select: { runs: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(workflows)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const wf = await prisma.workflow.create({
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
