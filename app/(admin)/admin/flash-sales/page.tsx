import prisma from "@/lib/prisma"
import { FlashSaleClient } from "./FlashSaleClient"

export default async function FlashSalesPage() {
  const [sales, products, categories] = await Promise.all([
    prisma.flashSale.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const formatted = sales.map((s) => ({
    id: s.id,
    name: s.name,
    discountType: s.discountType as string,
    discountValue: Number(s.discountValue),
    scope: s.scope as string,
    targetName: s.product?.name || s.category?.name || "Sitewide",
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    isActive: s.isActive,
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Flash Sales</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Time-limited discounts with countdown timers. Applied automatically — no coupon code needed.
        </p>
      </div>
      <FlashSaleClient
        data={formatted}
        products={products}
        categories={categories}
      />
    </div>
  )
}
