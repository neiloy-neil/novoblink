import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const bundle = await prisma.bundle.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, name: true, images: { take: 1 } } } }, orderBy: { sortOrder: "asc" } } },
  })
  if (!bundle) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ bundle })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json()
  const { name, slug, description, price, comparePrice, image, isActive, type, minItems, maxItems, discountPct, items } = body
  await prisma.bundleItem.deleteMany({ where: { bundleId: id } })
  const bundle = await prisma.bundle.update({
    where: { id },
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
  return NextResponse.json({ bundle })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  const { id } = await params
  await prisma.bundle.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
