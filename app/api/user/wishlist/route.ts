import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] })

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: true, category: true } } },
    orderBy: { createdAt: "desc" },
  })

  const items = rows.map((r) => ({
    id: r.product.id,
    name: r.product.name,
    slug: r.product.slug,
    price: Number(r.product.price),
    comparePrice: r.product.comparePrice ? Number(r.product.comparePrice) : null,
    image: r.product.images[0]?.url || "/placeholder.jpg",
    category: r.product.category?.name,
  }))

  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 })

  await prisma.wishlistItem.deleteMany({
    where: { userId: user.id, productId },
  })

  return NextResponse.json({ ok: true })
}
