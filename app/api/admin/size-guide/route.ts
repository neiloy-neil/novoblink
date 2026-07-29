import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 })
  const guide = await prisma.sizeGuide.findUnique({ where: { categoryId } })
  return NextResponse.json(guide)
}

export async function PUT(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { categoryId, unit, columns, rows, notes } = await req.json()
  const guide = await prisma.sizeGuide.upsert({
    where: { categoryId },
    create: { categoryId, unit: unit || "cm", columns, rows, notes: notes || null },
    update: { unit: unit || "cm", columns, rows, notes: notes || null },
  })
  return NextResponse.json(guide)
}
