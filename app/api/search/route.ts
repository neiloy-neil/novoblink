import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ products: [], total: 0 })

  try {
    const words = q.split(/\s+/).filter(Boolean)

    // Build OR conditions for each word (partial matching)
    const wordConditions = words.flatMap(word => [
      { name: { contains: word, mode: "insensitive" as const } },
      { description: { contains: word, mode: "insensitive" as const } },
      { tags: { contains: word, mode: "insensitive" as const } },
      { category: { name: { contains: word, mode: "insensitive" as const } } },
    ])

    const products = await prisma.product.findMany({
      where: { isActive: true, OR: wordConditions },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, category: true },
      take: 20,
    })

    // Boost exact name matches to top
    const sorted = [...products].sort((a, b) => {
      const aExact = a.name.toLowerCase().includes(q.toLowerCase()) ? 1 : 0
      const bExact = b.name.toLowerCase().includes(q.toLowerCase()) ? 1 : 0
      return bExact - aExact
    })

    const topResults = sorted.slice(0, 8)

    // Fire-and-forget analytics tracking
    prisma.searchAnalytic.create({
      data: {
        query: q,
        resultsCount: sorted.length,
        sessionId: req.cookies.get("session_id")?.value || null,
      }
    }).catch(() => {})

    return NextResponse.json({ products: topResults, total: sorted.length })
  } catch {
    return NextResponse.json({ products: [], total: 0 })
  }
}
