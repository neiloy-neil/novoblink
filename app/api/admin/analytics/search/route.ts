import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const analytics = await prisma.searchAnalytic.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  })

  const queryMap = new Map<string, { count: number; totalResults: number; clicks: number }>()
  for (const a of analytics) {
    const key = a.query.toLowerCase()
    const existing = queryMap.get(key) || { count: 0, totalResults: 0, clicks: 0 }
    queryMap.set(key, {
      count: existing.count + 1,
      totalResults: existing.totalResults + a.resultsCount,
      clicks: existing.clicks + (a.clicked ? 1 : 0),
    })
  }

  const topQueries = [...queryMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([query, stats]) => ({
      query,
      searches: stats.count,
      avgResults: Math.round(stats.totalResults / stats.count),
      clickRate: stats.count > 0 ? Math.round((stats.clicks / stats.count) * 100) : 0,
    }))

  const zeroResults = [...queryMap.entries()]
    .filter(([, s]) => s.totalResults === 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([query, stats]) => ({ query, searches: stats.count }))

  return NextResponse.json({ topQueries, zeroResults })
}
