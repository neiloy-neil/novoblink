import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import OrdersFilters from "./OrdersFilters"
import OrdersBulkClient from "./OrdersBulkClient"
import AdminPagination from "@/components/admin/AdminPagination"
import { getCustomerRiskBatch } from "@/lib/customerRisk"
import { Download } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 20


export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; paymentMethod?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status || ""
  const paymentMethod = params.paymentMethod || ""
  const page = Math.max(1, parseInt(params.page || "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: any = {
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { shippingName: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const riskMap = await getCustomerRiskBatch(orders.map((o: any) => o.shippingPhone)).catch(() => new Map())
  const riskByPhone = Object.fromEntries(riskMap)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Orders{" "}
          <span className="text-sm font-normal text-muted-foreground ml-2">{total} total</span>
        </h1>
        <a href={`/api/admin/orders/export${status ? `?status=${status}` : ""}`}>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </a>
      </div>

      <Card>
        <CardContent className="p-0">
          <OrdersFilters
            currentSearch={search}
            currentStatus={status}
            currentPayment={paymentMethod}
          />
          <OrdersBulkClient orders={orders as any} riskByPhone={riskByPhone} />
          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/orders" />
        </CardContent>
      </Card>
    </div>
  )
}
