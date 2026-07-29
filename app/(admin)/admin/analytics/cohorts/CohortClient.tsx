"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type Row = {
  id: string; name: string; email: string; joined: string
  ltv: number; orderCount: number; avgOrderValue: number
  daysSinceLastOrder: number | null; segment: string
}

const SEGMENT_COLORS: Record<string, string> = {
  VIP: "bg-purple-100 text-purple-800",
  Loyal: "bg-blue-100 text-blue-800",
  Active: "bg-green-100 text-green-800",
  "At Risk": "bg-orange-100 text-orange-800",
  New: "bg-gray-100 text-gray-700",
}

export default function CohortClient() {
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<{ totalLTV: number; segmentCounts: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin/analytics/cohorts?topN=200")
      .then(r => r.json())
      .then(d => { setRows(d.rows || []); setSummary({ totalLTV: d.totalLTV, segmentCounts: d.segmentCounts }); setLoading(false) })
  }, [])

  const filtered = rows.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-white border rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Total LTV (top 200)</p>
            <p className="text-xl font-bold">৳{Math.round(summary.totalLTV).toLocaleString()}</p>
          </div>
          {Object.entries(summary.segmentCounts).map(([seg, count]) => (
            <div key={seg} className="bg-white border rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{seg}</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      )}

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">LTV (৳)</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Avg order</TableHead>
              <TableHead className="text-right">Last order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found.</TableCell></TableRow>}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium text-sm">{r.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEGMENT_COLORS[r.segment] || ""}`}>{r.segment}</span>
                </TableCell>
                <TableCell className="text-right font-bold">৳{Math.round(r.ltv).toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.orderCount}</TableCell>
                <TableCell className="text-right text-muted-foreground">৳{Math.round(r.avgOrderValue).toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {r.daysSinceLastOrder !== null ? `${r.daysSinceLastOrder}d ago` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
