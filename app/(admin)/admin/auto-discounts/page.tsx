import prisma from "@/lib/prisma"
import { AutoDiscountClient } from "./AutoDiscountClient"

export default async function AutoDiscountsPage() {
  const discounts = await prisma.autoDiscount.findMany({ orderBy: { createdAt: "desc" } })

  const formatted = discounts.map((d) => ({
    id: d.id,
    name: d.name,
    ruleType: d.ruleType as string,
    thresholdQty: d.thresholdQty,
    thresholdAmt: d.thresholdAmt ? Number(d.thresholdAmt) : null,
    discountPct: Number(d.discountPct),
    isActive: d.isActive,
    endsAt: d.endsAt?.toISOString() || null,
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automatic Discounts</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Applied at checkout without a coupon code. Buy 2 get 10% off, spend ৳2000 get 15% off, etc.
        </p>
      </div>
      <AutoDiscountClient data={formatted} />
    </div>
  )
}
