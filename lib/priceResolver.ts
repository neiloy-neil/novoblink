import prisma from "@/lib/prisma"

type ResolveOptions = {
  productId: string
  basePrice: number
  quantity?: number
  userId?: string
}

export async function resolvePrice({ productId, basePrice, quantity = 1, userId }: ResolveOptions): Promise<number> {
  const now = new Date()
  const rules = await prisma.priceRule.findMany({
    where: {
      isActive: true,
      OR: [{ productId }, { productId: null }],
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  })

  let userTags: string[] = []
  if (userId) {
    const tags = await prisma.customerTag.findMany({ where: { userId }, select: { tag: true } })
    userTags = tags.map(t => t.tag)
  }

  let bestDiscount = 0

  for (const rule of rules) {
    let applicable = false
    if (rule.type === "TAG_DISCOUNT" && rule.tagName && userTags.includes(rule.tagName)) {
      applicable = true
    } else if (rule.type === "QTY_TIER" && rule.minQty && quantity >= rule.minQty) {
      applicable = true
    }

    if (!applicable) continue

    let discountAmount = 0
    if (rule.discountType === "PERCENTAGE") {
      discountAmount = basePrice * (Number(rule.discountValue) / 100)
    } else {
      discountAmount = Number(rule.discountValue)
    }
    if (discountAmount > bestDiscount) bestDiscount = discountAmount
  }

  return Math.max(0, basePrice - bestDiscount)
}
