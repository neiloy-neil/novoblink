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
