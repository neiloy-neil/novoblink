import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } })
    return NextResponse.json(categories)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { name, slug, description, image, sortOrder, isActive } = await req.json()
    if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json(category, { status: 201 })
  } catch (e: any) {
    if (e.code === "P2002") return NextResponse.json({ error: "A category with that slug already exists" }, { status: 409 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
