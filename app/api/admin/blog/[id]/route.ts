import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { category: true, products: { include: { product: { include: { images: { take: 1 } } } } } } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const data = await req.json()
  const current = await prisma.blogPost.findUnique({ where: { id } })
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content,
      coverImage: data.coverImage || null,
      authorName: data.authorName || "Admin",
      categoryId: data.categoryId || null,
      tags: data.tags || null,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished && !current?.publishedAt ? new Date() : current?.publishedAt,
    },
  })
  return NextResponse.json(post)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
