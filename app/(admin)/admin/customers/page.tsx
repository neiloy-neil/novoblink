import prisma from "@/lib/prisma"
import { CustomerClient } from "./CustomerClient"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search = "" } = await searchParams

  const searchWhere = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  // Registered users
  const users = await prisma.user.findMany({
    where: searchWhere,
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  // Guest orders (no user account) — includes orders with AND without guestEmail
  const guestOrders = await prisma.order.findMany({
    where: {
      userId: null,
      ...(search
        ? {
            OR: [
              { shippingName: { contains: search, mode: "insensitive" } },
              { guestEmail: { contains: search, mode: "insensitive" } },
              { shippingPhone: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by guestEmail when present, otherwise by "name|phone" fingerprint
  const guestMap = new Map<string, typeof guestOrders>()
  for (const o of guestOrders) {
    const key = o.guestEmail
      ? `email:${o.guestEmail}`
      : `name:${(o.shippingName || "Guest").toLowerCase().trim()}|${(o.shippingPhone || "").trim()}`
    if (!guestMap.has(key)) guestMap.set(key, [])
    guestMap.get(key)!.push(o)
  }

  const registeredCustomers = users.map((user) => {
    const totalSpent = user.orders
      .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0)
    return {
      id: user.id,
      name: user.name || "—",
      email: user.email,
      phone: user.phone || "—",
      role: user.role,
      joinedDate: user.createdAt.toISOString(),
      totalOrders: user.orders.length,
      totalSpent,
      lastOrderAt: user.orders[0]?.createdAt.toISOString() ?? user.createdAt.toISOString(),
      orders: user.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    }
  })

  const guestCustomers = Array.from(guestMap.entries()).map(([, orders]) => {
    const latest = orders[0]
    const totalSpent = orders
      .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0)
    const email = latest.guestEmail ?? `guest-${latest.id}@no-email`
    return {
      id: `guest:${email}`,
      name: latest.shippingName || "Guest",
      email: latest.guestEmail ?? "—",
      phone: latest.shippingPhone || "—",
      role: "GUEST",
      joinedDate: latest.createdAt.toISOString(),
      totalOrders: orders.length,
      totalSpent,
      lastOrderAt: latest.createdAt.toISOString(),
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
      })),
    }
  })

  // Merge and sort by most recent activity
  const customers = [...registeredCustomers, ...guestCustomers].sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  )

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {registeredCustomers.length} registered · {guestCustomers.length} guests
          </p>
        </div>
        <Link href="/admin/customers/import">
          <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" /> Import CSV</Button>
        </Link>
      </div>
      <CustomerClient data={customers} />
    </div>
  )
}
