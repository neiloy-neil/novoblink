"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PACKED: "#8b5cf6",
  SHIPPED: "#6366f1",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  RETURNED: "#f97316",
  DRAFT: "#94a3b8",
}

const PAYMENT_COLORS = ["#1a1a1a", "#f59e0b", "#10b981", "#6366f1", "#ec4899"]

export default function DashboardCharts({
  topProducts,
  statusData,
  paymentData,
}: {
  topProducts: { name: string; revenue: number; units: number }[]
  statusData: { name: string; value: number }[]
  paymentData: { method: string; count: number; revenue: number }[]
}) {
  const hasProducts = topProducts.length > 0
  const hasStatus = statusData.length > 0
  const hasPayment = paymentData.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Top Products */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Products — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasProducts ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.units} units sold</p>
                  </div>
                  <span className="text-sm font-mono font-bold shrink-0">৳{p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Breakdown */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Order Status — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasStatus ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No orders yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                  fontSize={10}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [v, "Orders"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Split */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment Methods — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPayment ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={paymentData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <XAxis type="number" fontSize={10} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="method" fontSize={10} width={55} />
                <Tooltip formatter={(v: any) => [`৳${Number(v).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
