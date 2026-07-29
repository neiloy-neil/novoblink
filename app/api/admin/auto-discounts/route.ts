import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const discounts = await prisma.autoDiscount.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json({ discounts })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, ruleType, thresholdQty, thresholdAmt, discountPct, startsAt, endsAt } = body
    if (!name || !ruleType || !discountPct) {
      return NextResponse.json({ error: "Name, rule type, and discount % are required" }, { status: 400 })
    }
    const discount = await prisma.autoDiscount.create({
      data: {
        name,
        ruleType,
        thresholdQty: thresholdQty ? Number(thresholdQty) : null,
        thresholdAmt: thresholdAmt ? Number(thresholdAmt) : null,
        discountPct: Number(discountPct),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    })
    return NextResponse.json({ discount }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
