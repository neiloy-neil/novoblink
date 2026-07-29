import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rules = await prisma.priceRule.findMany({
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const rule = await prisma.priceRule.create({
    data: {
      name: body.name,
      type: body.type,
      productId: body.productId || null,
      tagName: body.tagName || null,
      minQty: body.minQty ? Number(body.minQty) : null,
      discountType: body.discountType || "PERCENTAGE",
      discountValue: Number(body.discountValue),
      isActive: body.isActive ?? true,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    },
  })
  return NextResponse.json(rule)
}
