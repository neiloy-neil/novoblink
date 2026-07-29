import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")

  const items = await prisma.wishlistItem.findMany({
    where: session ? { userId: session.user.id } : sessionId ? { sessionId } : { id: "none" },
    include: { product: { include: { images: { take: 1 }, variants: { take: 1 } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth()
  const { productId, variantId, sessionId } = await req.json()
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })

  const userId = session?.user.id
  if (!userId && !sessionId) return NextResponse.json({ error: "sessionId required for guests" }, { status: 400 })

  // Check if already wishlisted — toggle off
  const existing = userId
    ? await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } })
    : await prisma.wishlistItem.findFirst({ where: { sessionId: sessionId!, productId } })

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } })
    return NextResponse.json({ wishlisted: false })
  }

  await prisma.wishlistItem.create({
    data: { userId: userId || null, sessionId: userId ? null : sessionId, productId, variantId: variantId || null },
  })
  return NextResponse.json({ wishlisted: true })
}
