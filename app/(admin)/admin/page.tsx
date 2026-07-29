import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle, ShoppingCart, TrendingUp, Users, AlertCircle, Clock, RefreshCw, Package } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import RevenueChart from "@/components/admin/RevenueChart"
import DashboardCharts from "@/components/admin/DashboardCharts"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-orange-100 text-orange-800",
}

export default async function DashboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const [
    ordersToday,
    pendingOrders,
    customersTotal,
    newCustomersToday,
    lowStockCount,
    outOfStockCount,
    pendingReturns,
    revenueOrders,
    revenue30d,
    recentOrders,
    topProducts,
    ordersByStatus,
    ordersByPayment,
    aovData,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED"] } } }).catch(() => 0),
    prisma.user.count({ where: { role: "CUSTOMER" } }).catch(() => 0),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: today } } }).catch(() => 0),
    prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }).catch(() => 0),
    prisma.productVariant.count({ where: { stock: 0 } }).catch(() => 0),
    prisma.returnRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }).catch(() => []),
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }).catch(() => []),
    // Top 5 products by revenue (last 30 days)
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } } },
      _sum: { price: true, quantity: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }).catch(() => []),
    // Orders by status
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { id: true },
    }).catch(() => []),
    // Orders by payment method (30d)
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _count: { id: true },
      _sum: { total: true },
    }).catch(() => []),
    // AOV (30d)
    prisma.order.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo }, status: { not: "CANCELLED" } },
      _avg: { total: true },
      _count: { id: true },
    }).catch(() => ({ _avg: { total: 0 }, _count: { id: 0 } })),
  ])

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sevenDaysAgo)
    date.setDate(date.getDate() + i)
    const dateStr = date.toDateString()
    const total = revenueOrders
      .filter((o) => new Date(o.createdAt).toDateString() === dateStr)
      .reduce((sum, o) => sum + Number(o.total), 0)
    return { name: dayNames[date.getDay()], total }
  })

  const revenueToday = revenueOrders
    .filter((o) => new Date(o.createdAt).toDateString() === today.toDateString())
    .reduce((sum, o) => sum + Number(o.total), 0)

  const revenue30dTotal = Number(revenue30d._sum.total || 0)
  const aov = Math.round(Number(aovData._avg.total || 0))
  const orderCount30d = aovData._count.id

  const topProductsData = topProducts.map((p: any) => ({
    name: p.productName,
    revenue: Number(p._sum.price || 0) * (p._sum.quantity || 1),
    units: p._sum.quantity || 0,
  }))

  const statusData = ordersByStatus.map((s: any) => ({ name: s.status, value: s._count.id }))
  const paymentData = ordersByPayment.map((p: any) => ({
    method: p.paymentMethod,
    count: p._count.id,
    revenue: Number(p._sum.total || 0),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/orders/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" /> New Order
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert banners */}
      {(pendingOrders > 0 || lowStockCount > 0 || pendingReturns > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingOrders > 0 && (
            <Link href="/admin/orders" className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 transition-colors">
              <Clock className="h-4 w-4" />
              {pendingOrders} order{pendingOrders !== 1 ? "s" : ""} awaiting confirmation
            </Link>
          )}
          {lowStockCount > 0 && (
            <Link href="/admin/inventory" className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-800 hover:bg-orange-100 transition-colors">
              <Package className="h-4 w-4" />
              {lowStockCount} variant{lowStockCount !== 1 ? "s" : ""} low on stock
            </Link>
          )}
          {pendingReturns > 0 && (
            <Link href="/admin/returns" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800 hover:bg-red-100 transition-colors">
              <RefreshCw className="h-4 w-4" />
              {pendingReturns} return{pendingReturns !== 1 ? "s" : ""} to review
            </Link>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Today's Revenue" value={`৳${revenueToday.toLocaleString()}`} icon={TrendingUp}
          sub={`৳${revenue30dTotal.toLocaleString()} last 30 days`} />
        <KpiCard title="Orders Today" value={String(ordersToday)} icon={ShoppingCart}
          sub={pendingOrders > 0 ? `${pendingOrders} pending confirmation` : "All confirmed"} highlight={pendingOrders > 0} />
        <KpiCard title="Avg. Order Value" value={aov > 0 ? `৳${aov.toLocaleString()}` : "—"} icon={TrendingUp}
          sub={`${orderCount30d} orders last 30 days`} />
        <KpiCard title="Customers" value={customersTotal.toLocaleString()} icon={Users}
          sub={newCustomersToday > 0 ? `+${newCustomersToday} new today` : "No new today"} />
        <KpiCard title="Stock Alerts" value={String(lowStockCount + outOfStockCount)} icon={AlertCircle}
          sub={outOfStockCount > 0 ? `${outOfStockCount} out of stock` : "No stockouts"} highlight={outOfStockCount > 0} />
      </div>

      {/* Charts + recent orders */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={revenueByDay} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No orders yet</TableCell>
                  </TableRow>
                )}
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="pl-6">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-sm hover:underline">{order.orderNumber}</Link>
                      <p className="text-xs text-muted-foreground">{order.user?.name || order.shippingName || "Guest"}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6 text-sm font-medium">৳{Number(order.total).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: top products + order status + payment split */}
      <DashboardCharts
        topProducts={topProductsData}
        statusData={statusData}
        paymentData={paymentData}
      />
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, sub, highlight }: {
  title: string; value: string; icon: any; sub: string; highlight?: boolean
}) {
  return (
    <Card className={highlight ? "border-orange-200 bg-orange-50/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${highlight ? "text-orange-500" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-orange-600" : ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
