import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const couponId = req.nextUrl.searchParams.get("couponId")
  if (!couponId) return NextResponse.json({ error: "couponId required" }, { status: 400 })
  const rule = await prisma.couponRule.findUnique({ where: { couponId } })
  return NextResponse.json(rule)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const rule = await prisma.couponRule.upsert({
    where: { couponId: body.couponId },
    create: {
      couponId: body.couponId,
      ruleType: body.ruleType,
      buyQty: body.buyQty ? Number(body.buyQty) : null,
      getQty: body.getQty ? Number(body.getQty) : null,
      categoryId: body.categoryId || null,
      minItems: body.minItems ? Number(body.minItems) : null,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      isStackable: body.isStackable || false,
      usagePerUser: body.usagePerUser ? Number(body.usagePerUser) : null,
    },
    update: {
      ruleType: body.ruleType,
      buyQty: body.buyQty ? Number(body.buyQty) : null,
      getQty: body.getQty ? Number(body.getQty) : null,
      categoryId: body.categoryId || null,
      minItems: body.minItems ? Number(body.minItems) : null,
      maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
      isStackable: body.isStackable || false,
      usagePerUser: body.usagePerUser ? Number(body.usagePerUser) : null,
    },
  })
  return NextResponse.json(rule)
}
