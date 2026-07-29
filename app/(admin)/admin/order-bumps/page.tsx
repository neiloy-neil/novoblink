import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import OrderBumpsClient from "./OrderBumpsClient"

export default async function OrderBumpsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const [bumps, products] = await Promise.all([
    prisma.orderBump.findMany({
      include: { product: { select: { id: true, name: true, price: true, images: { take: 1 } } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Order Bumps</h1>
        <p className="text-sm text-muted-foreground mt-1">Offer add-on products at checkout with a compelling one-click headline.</p>
      </div>
      <OrderBumpsClient data={JSON.parse(JSON.stringify(bumps))} products={JSON.parse(JSON.stringify(products))} />
    </div>
  )
}
