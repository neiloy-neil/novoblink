import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    })
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, images, variants, metaTitle, metaDescription, ogImage } = body

    // Update product fields
    const product = await prisma.product.update({
      where: { id },
      data: { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, metaTitle: metaTitle || null, metaDescription: metaDescription || null, ogImage: ogImage || null },
    })

    // Sync images: delete old, recreate
    if (Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt || "",
            sortOrder: i,
            videoUrl: img.videoUrl || null,
            isVideo: img.isVideo || false,
          })),
        })
      }
    }

    // Sync variants: upsert by SKU so existing order references are preserved
    if (Array.isArray(variants)) {
      const existing = await prisma.productVariant.findMany({ where: { productId: id } })
      const existingBySku = new Map(existing.map(v => [v.sku, v]))
      const incomingSkus = new Set(variants.map((v: any) => v.sku))

      for (const v of variants) {
        const data = {
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || null,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : null,
          comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
          costPrice: Number(v.costPrice) || 0,
        }
        const match = existingBySku.get(v.sku)
        if (match) {
          await prisma.productVariant.update({ where: { id: match.id }, data })
        } else {
          await prisma.productVariant.create({ data: { ...data, productId: id, sku: v.sku } })
        }
      }

      // Delete removed variants only if no order items reference them
      for (const v of existing) {
        if (!incomingSkus.has(v.sku)) {
          const refs = await prisma.orderItem.count({ where: { variantId: v.id } })
          if (refs === 0) await prisma.productVariant.delete({ where: { id: v.id } })
        }
      }
    }

    return NextResponse.json(product)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
