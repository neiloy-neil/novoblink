import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const bundles = await prisma.bundle.findMany({
    include: { items: { include: { product: { select: { name: true, images: { take: 1 } } } }, orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ bundles })
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  const body = await req.json()
  const { name, slug, description, price, comparePrice, image, isActive, type, minItems, maxItems, discountPct, items } = body
  const bundle = await prisma.bundle.create({
    data: {
      name, slug, description, price, comparePrice: comparePrice || null, image: image || null,
      isActive: isActive ?? true, type: type || "FIXED",
      minItems: minItems || null, maxItems: maxItems || null, discountPct: discountPct || null,
      items: {
        create: (items || []).map((item: any, i: number) => ({
          productId: item.productId, quantity: item.quantity || 1, sortOrder: i,
        })),
      },
    },
    include: { items: true },
  })
  return NextResponse.json({ bundle }, { status: 201 })
}
