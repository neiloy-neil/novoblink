import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const sales = await prisma.flashSale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
    })
    return NextResponse.json({ sales })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, discountType, discountValue, scope, productId, categoryId, startsAt, endsAt, isActive } = body
    if (!name || !discountType || !discountValue || !startsAt || !endsAt) {
      return NextResponse.json({ error: "Name, discount, and dates are required" }, { status: 400 })
    }
    const sale = await prisma.flashSale.create({
      data: {
        name,
        discountType,
        discountValue: Number(discountValue),
        scope: scope || "SITEWIDE",
        productId: scope === "PRODUCT" ? productId : null,
        categoryId: scope === "CATEGORY" ? categoryId : null,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json({ sale }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
