import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ items: [] })

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: { images: { take: 1 }, category: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    items: items.map((w) => ({
      id: w.product.id,
      name: w.product.name,
      slug: w.product.slug,
      price: Number(w.product.price),
      comparePrice: w.product.comparePrice ? Number(w.product.comparePrice) : null,
      image: w.product.images[0]?.url || "",
      category: w.product.category?.name || "",
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  })

  return NextResponse.json({ ok: true })
}
