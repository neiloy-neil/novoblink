import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { serialize } from "@/lib/utils"
import DraftOrderClient from "./DraftOrderClient"

export default async function DraftOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { include: { images: { take: 1 } } } } } }
  }).catch(() => null)

  if (!order || order.status !== "DRAFT") notFound()

  return <DraftOrderClient order={serialize(order)} />
}
