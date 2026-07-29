import prisma from "@/lib/prisma"
import { DeliveryClient } from "./DeliveryClient"
import { startOfMonth, endOfMonth } from "date-fns"

export default async function DeliveryPage({
  searchParams,
}: {
  searchParams: { courier?: string; status?: string }
}) {
  const courierFilter = searchParams.courier
  const statusFilter = searchParams.status

  const where: any = {}
  if (courierFilter) where.courier = courierFilter
  if (statusFilter) where.status = statusFilter

  const deliveries = await prisma.delivery.findMany({
    where,
    include: {
      order: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const startMonth = startOfMonth(now)
  const endMonth = endOfMonth(now)

  const monthStats = await prisma.delivery.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startMonth,
        lte: endMonth,
      },
    },
    _count: {
      _all: true,
    },
  })

  const stats = {
    totalSent: 0,
    inTransit: 0,
    delivered: 0,
    failed: 0,
  }

  monthStats.forEach((stat) => {
    stats.totalSent += stat._count._all
    if (stat.status === "IN_TRANSIT") stats.inTransit += stat._count._all
    if (stat.status === "DELIVERED") stats.delivered += stat._count._all
    if (stat.status === "FAILED") stats.failed += stat._count._all
  })

  const formattedData = deliveries.map(d => ({
    id: d.id,
    orderId: d.orderId,
    orderNumber: d.order.orderNumber,
    customerName: d.order.user?.name || d.order.shippingName,
    courier: d.courier,
    consignmentId: d.consignmentId,
    trackingCode: d.trackingCode,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Delivery Management</h2>
      </div>
      <DeliveryClient data={formattedData} stats={stats} />
    </div>
  )
}
