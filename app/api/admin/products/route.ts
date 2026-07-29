import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""

    const products = await prisma.product.findMany({
      where: {
        name: { contains: search, mode: "insensitive" },
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { name, slug, description, price, comparePrice, categoryId, tags, isActive, isFeatured, images, variants } = body

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        categoryId,
        tags,
        isActive,
        isFeatured,
        images: {
          create: images.map((img: any, i: number) => ({ url: img.url, alt: img.alt || "", sortOrder: i }))
        },
        variants: {
          create: variants.map((v: any) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            sku: v.sku,
            stock: v.stock,
            price: v.price
          }))
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
