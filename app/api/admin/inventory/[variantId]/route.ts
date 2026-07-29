import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { sendLowStockAlert, sendBackInStockAlert } from "@/lib/email"

const LOW_STOCK_THRESHOLD = 5

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { variantId } = await params
    const body = await request.json()
    const { stock } = body

    if (typeof stock !== "number" || stock < 0) {
      return NextResponse.json({ error: "Invalid stock value" }, { status: 400 })
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock },
      include: { product: { select: { name: true, slug: true } } },
    })

    // Low stock alert to admin
    if (stock <= LOW_STOCK_THRESHOLD) {
      sendLowStockAlert([{
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        stock,
        sku: variant.sku,
      }]).catch(() => {})
    }

    // Back-in-stock: notify waiting customers when stock goes from 0 → positive
    if (stock > 0) {
      const alerts = await prisma.stockAlert.findMany({
        where: { variantId, notified: false },
        select: { id: true, email: true },
      })
      if (alerts.length > 0) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://NovoBlink.com.bd"
        const productUrl = `${siteUrl}/shop/${variant.product.slug}`
        const variantLabel = `${variant.size} / ${variant.color}`
        await Promise.all(
          alerts.map(a =>
            sendBackInStockAlert({ to: a.email, productName: variant.product.name, variantLabel, productUrl }).catch(() => {})
          )
        )
        await prisma.stockAlert.updateMany({
          where: { id: { in: alerts.map(a => a.id) } },
          data: { notified: true },
        })
      }
    }

    return NextResponse.json({ variant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
