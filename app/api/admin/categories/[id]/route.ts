import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const { name, slug, description, image, sortOrder, isActive } = await req.json()
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json(category)
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "Slug already in use" }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { id } = await params
    const count = await prisma.product.count({ where: { categoryId: id } })
    if (count > 0) return NextResponse.json({ error: `Cannot delete: ${count} product(s) still use this category` }, { status: 400 })
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
