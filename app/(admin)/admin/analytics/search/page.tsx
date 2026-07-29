import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"

export default async function SearchAnalyticsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const analytics = await prisma.searchAnalytic.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  }).catch(() => [])

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
      query, searches: stats.count,
      avgResults: Math.round(stats.totalResults / stats.count),
      clickRate: stats.count > 0 ? Math.round((stats.clicks / stats.count) * 100) : 0,
    }))

  const zeroResults = [...queryMap.entries()]
    .filter(([, s]) => s.totalResults === 0)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([query, stats]) => ({ query, searches: stats.count }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Search Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 30 days · {analytics.length.toLocaleString()} searches</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-3">Top Search Queries</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="px-4 py-2 text-left">Query</th>
                <th className="px-4 py-2 text-right">Searches</th>
                <th className="px-4 py-2 text-right">Avg Results</th>
                <th className="px-4 py-2 text-right">Click Rate</th>
              </tr></thead>
              <tbody>
                {topQueries.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No data yet</td></tr>}
                {topQueries.map((q, i) => (
                  <tr key={q.query} className="border-t">
                    <td className="px-4 py-2 font-medium">{q.query}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{q.searches}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{q.avgResults}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{q.clickRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Zero-Result Searches <span className="text-sm font-normal text-muted-foreground">(content gaps)</span></h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="px-4 py-2 text-left">Query</th>
                <th className="px-4 py-2 text-right">Searches</th>
              </tr></thead>
              <tbody>
                {zeroResults.length === 0 && <tr><td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No zero-result searches</td></tr>}
                {zeroResults.map(q => (
                  <tr key={q.query} className="border-t">
                    <td className="px-4 py-2 font-medium text-red-600">{q.query}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">{q.searches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
