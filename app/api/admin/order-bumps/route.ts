import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const bumps = await prisma.orderBump.findMany({
    include: { product: { select: { id: true, name: true, price: true, images: { take: 1 } } } },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(bumps)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const bump = await prisma.orderBump.create({
    data: {
      productId: body.productId,
      headline: body.headline,
      description: body.description || null,
      discountPct: Number(body.discountPct) || 0,
      triggerMinTotal: body.triggerMinTotal ? Number(body.triggerMinTotal) : null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder || 0,
    },
  })
  return NextResponse.json(bump)
}
