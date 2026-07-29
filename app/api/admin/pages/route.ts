import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } })
    return NextResponse.json({ pages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const body = await req.json()
    const { slug, title, content, isPublished } = body
    if (!slug?.trim() || !title?.trim()) {
      return NextResponse.json({ error: "Slug and title are required" }, { status: 400 })
    }
    const page = await prisma.page.create({
      data: {
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        title,
        content: content || "",
        isPublished: isPublished ?? true,
      },
    })
    return NextResponse.json({ page }, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
