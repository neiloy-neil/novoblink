import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const fbt = await prisma.frequentlyBoughtTogether.findMany({
      where: { productId: id },
      orderBy: { sortOrder: "asc" },
      include: {
        related: {
          include: { images: { take: 1, orderBy: { sortOrder: "asc" } } }
        }
      }
    })
    const items = fbt.map(f => ({
      id: f.related.id,
      name: f.related.name,
      slug: f.related.slug,
      price: Number(f.related.price),
      comparePrice: f.related.comparePrice ? Number(f.related.comparePrice) : undefined,
      image: f.related.images[0]?.url || null,
    }))
    return NextResponse.json({ items })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { relatedId } = await req.json()
    if (!relatedId || relatedId === id) return NextResponse.json({ error: "Invalid relatedId" }, { status: 400 })
    const entry = await prisma.frequentlyBoughtTogether.upsert({
      where: { productId_relatedId: { productId: id, relatedId } },
      update: {},
      create: { productId: id, relatedId },
    })
    return NextResponse.json(entry)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { relatedId } = await req.json()
    await prisma.frequentlyBoughtTogether.deleteMany({ where: { productId: id, relatedId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
