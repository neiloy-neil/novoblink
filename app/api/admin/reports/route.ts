import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { subDays } from "date-fns"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "30" // 7, 30, today, all
    
    let fromDate = new Date(0)
    const now = new Date()

    if (range === "today") {
      fromDate = new Date(now.setHours(0, 0, 0, 0))
    } else if (range === "7") {
      fromDate = subDays(now, 7)
    } else if (range === "30") {
      fromDate = subDays(now, 30)
    }

    const where = {
      createdAt: { gte: fromDate }
    }

    // Orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
    })

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // New Customers
    const newCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: { gte: fromDate },
      },
    })

    // Payment Method Pie Chart
    let bkash = 0, nagad = 0, cod = 0
    orders.forEach((o) => {
      if (o.paymentMethod === "BKASH") bkash++
      if (o.paymentMethod === "NAGAD") nagad++
      if (o.paymentMethod === "COD") cod++
    })
    const paymentData = [
      { name: "bKash", value: bkash },
      { name: "Nagad", value: nagad },
      { name: "COD", value: cod },
    ]

    // Order Status Bar Chart
    const statusCounts: Record<string, number> = {}
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    })
    const statusData = Object.entries(statusCounts).map(([name, count]) => ({
      name,
      count,
    }))

    // Revenue Line Chart (Daily)
    const dailyRevenueMap: Record<string, number> = {}
    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split("T")[0]
      dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + Number(o.total)
    })
    const revenueData = Object.entries(dailyRevenueMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }))

    // Top 10 Products
    const productStats: Record<string, { name: string; units: number; revenue: number }> = {}
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = { name: item.productName, units: 0, revenue: 0 }
        }
        productStats[item.productId].units += item.quantity
        productStats[item.productId].revenue += Number(item.price) * item.quantity
      })
    })

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Export Data (Raw orders data for CSV)
    const exportData = orders.map(o => ({
      OrderNumber: o.orderNumber,
      Date: o.createdAt,
      Status: o.status,
      PaymentMethod: o.paymentMethod,
      PaymentStatus: o.paymentStatus,
      Total: Number(o.total),
    }))

    // ─── P&L (lightweight, cash-basis) ───────────────────────────
    // COGS = cost of inventory actually received from suppliers in range.
    // Expenses = operating costs logged in range.
    const [receivedPOs, expenses] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { status: "RECEIVED", receivedAt: { gte: fromDate } },
        select: { totalCost: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: fromDate } },
        select: { amount: true, category: true },
      }),
    ])

    const totalCOGS = receivedPOs.reduce((sum, po) => sum + Number(po.totalCost), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const netProfit = totalRevenue - totalCOGS - totalExpenses

    const expensesByCategory: Record<string, number> = {}
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount)
    })

    return NextResponse.json({
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        newCustomers,
      },
      pnl: {
        revenue: totalRevenue,
        cogs: totalCOGS,
        expenses: totalExpenses,
        netProfit,
        expensesByCategory: Object.entries(expensesByCategory).map(([name, value]) => ({ name, value })),
      },
      paymentData,
      statusData,
      revenueData,
      topProducts,
      exportData,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
