import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { serialize } from "@/lib/utils"
import PurchaseOrderDetailsClient from "@/components/admin/PurchaseOrderDetailsClient"

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const purchaseOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { variant: { include: { product: true } } } },
    },
  })

  if (!purchaseOrder) notFound()

  return <PurchaseOrderDetailsClient initialPO={serialize(purchaseOrder)} />
}
