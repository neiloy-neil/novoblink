import prisma from "@/lib/prisma"
import { CouponClient } from "./CouponClient"

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  // We have to convert Decimal to number for the client component
  const formattedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
      </div>
      <CouponClient data={formattedCoupons} />
    </div>
  )
}
