import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const { tags } = await req.json()
  if (!Array.isArray(tags)) return NextResponse.json({ error: "tags must be array" }, { status: 400 })
  const order = await prisma.order.update({ where: { id }, data: { tags } })
  return NextResponse.json(order)
}
