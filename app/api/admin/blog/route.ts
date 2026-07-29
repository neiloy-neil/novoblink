import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      excerpt: data.excerpt || null,
      content: data.content,
      coverImage: data.coverImage || null,
      authorName: data.authorName || session.user.name || "Admin",
      categoryId: data.categoryId || null,
      tags: data.tags || null,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
    },
  })
  return NextResponse.json(post)
}
