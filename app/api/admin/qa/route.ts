import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const filter = req.nextUrl.searchParams.get("filter") // "unanswered" | "unpublished" | "all"
  const search = req.nextUrl.searchParams.get("search") || ""

  const where: any = {}
  if (filter === "unanswered") where.answer = null
  if (filter === "unpublished") where.isPublished = false
  if (search) where.OR = [
    { question: { contains: search, mode: "insensitive" } },
    { product: { name: { contains: search, mode: "insensitive" } } },
    { guestName: { contains: search, mode: "insensitive" } },
  ]

  const qas = await prisma.reviewQA.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(qas)
}
