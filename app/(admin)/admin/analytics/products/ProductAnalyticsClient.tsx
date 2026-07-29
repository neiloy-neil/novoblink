"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

type Row = {
  product: { id: string; name: string; slug: string; images: { url: string }[] }
  revenue: number; unitsSold: number; orders: number; views: number; conversionRate: string
}

export default function ProductAnalyticsClient() {
  const [rows, setRows] = useState<Row[]>([])
  const [period, setPeriod] = useState("30")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/analytics/products?days=${period}`)
      .then(r => r.json())
      .then(d => { setRows(d.rows || []); setLoading(false) })
  }, [period])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rows.length} products · last {period} days</p>
        <Select value={period} onValueChange={v => setPeriod(v ?? period)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Units sold</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Conversion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sales data for this period.</TableCell></TableRow>}
            {rows.map((r, i) => (
              <TableRow key={r.product.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                    {r.product.images[0] && (
                      <img src={r.product.images[0].url} alt={r.product.name} className="w-8 h-8 rounded object-cover" />
                    )}
                    <Link href={`/admin/products`} className="text-sm font-medium hover:underline line-clamp-1 max-w-[200px]">
                      {r.product.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">৳{r.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.unitsSold}</TableCell>
                <TableCell className="text-right">{r.orders}</TableCell>
                <TableCell className="text-right text-muted-foreground">{r.views}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-xs">{r.conversionRate}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
