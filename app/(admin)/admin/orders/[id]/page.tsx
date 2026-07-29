import prisma from "@/lib/prisma"
import { serialize } from "@/lib/utils"
import { notFound } from "next/navigation"
import OrderDetailsClient from "@/components/admin/OrderDetailsClient"
import { getCustomerRisk } from "@/lib/customerRisk"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: {
        include: {
          product: { include: { images: true } }
        }
      },
      payment: true,
      delivery: true,
      statusLogs: { orderBy: { createdAt: "desc" } }
    }
  }).catch(() => null)

  if (!order) {
    notFound()
  }

  const risk = await getCustomerRisk(order.shippingPhone).catch(() => null)

  return (
    <div className="mx-auto max-w-6xl w-full">
      <OrderDetailsClient initialOrder={serialize(order)} customerRisk={risk} />
    </div>
  )
}
