import prisma from "@/lib/prisma"

export async function getSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["points_per_taka", "points_redemption_rate"] } }
  })
  
  const map = settings.reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {} as Record<string, string>)
  
  // default: 1 point per 10 taka
  const pointsPerTaka = map["points_per_taka"] ? Number(map["points_per_taka"]) : 10
  // default: 10 points = 1 taka
  const redemptionRate = map["points_redemption_rate"] ? Number(map["points_redemption_rate"]) : 10

  return { pointsPerTaka, redemptionRate }
}

export async function awardPoints(userId: string, orderId: string, orderTotal: number) {
  const { pointsPerTaka } = await getSettings()
  
  const pointsToAward = Math.floor(orderTotal / pointsPerTaka)
  
  if (pointsToAward <= 0) return 0
  
  await prisma.loyaltyPoint.create({
    data: {
      userId,
      points: pointsToAward,
      type: "EARNED",
      orderId,
      description: "Earned from order",
    }
  })
  
  return pointsToAward
}

export async function redeemPoints(userId: string, pointsToRedeem: number) {
  const currentBalance = await getBalance(userId)
  
  if (pointsToRedeem > currentBalance) {
    throw new Error("Insufficient point balance")
  }
  
  const { redemptionRate } = await getSettings()
  
  const discountValue = pointsToRedeem / redemptionRate
  
  await prisma.loyaltyPoint.create({
    data: {
      userId,
      points: -pointsToRedeem,
      type: "REDEEMED",
      description: "Redeemed for order discount",
    }
  })
  
  return discountValue
}

export async function getBalance(userId: string) {
  const result = await prisma.loyaltyPoint.aggregate({
    where: { userId },
    _sum: { points: true },
  })
  return result._sum.points ?? 0
}

export async function getHistory(userId: string) {
  return await prisma.loyaltyPoint.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })
}
