import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, variantId } = await req.json()
    if (!email?.trim() || !variantId?.trim()) {
      return NextResponse.json({ error: "Email and variant are required" }, { status: 400 })
    }

    // Check the variant actually exists and is out of stock
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
    if (!variant) {
      return NextResponse.json({ error: "Product variant not found" }, { status: 404 })
    }
    if (variant.stock > 0) {
      return NextResponse.json({ error: "This item is currently in stock" }, { status: 400 })
    }

    await prisma.stockAlert.upsert({
      where: { email_variantId: { email: email.trim().toLowerCase(), variantId } },
      create: { email: email.trim().toLowerCase(), variantId, notified: false },
      update: { notified: false }, // re-subscribe if they already requested before
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
