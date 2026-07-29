import prisma from "@/lib/prisma"

export type CartItem = {
  variantId: string
  productId: string
  quantity: number
  price: number
}

export type AppliedDiscount = {
  id: string
  name: string
  discountPct: number
  savingAmount: number
}

/**
 * Evaluates all active auto-discounts against the cart and returns
 * the best applicable discount (highest saving). No stacking — one
 * auto discount at a time to keep it simple and predictable.
 */
export async function getBestAutoDiscount(
  items: CartItem[],
  subtotal: number
): Promise<AppliedDiscount | null> {
  const now = new Date()
  const rules = await prisma.autoDiscount.findMany({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  })

  let best: AppliedDiscount | null = null

  for (const rule of rules) {
    const pct = Number(rule.discountPct)
    let qualifies = false

    if (rule.ruleType === "SPEND_X_GET_PERCENT" && rule.thresholdAmt) {
      qualifies = subtotal >= Number(rule.thresholdAmt)
    }

    if (rule.ruleType === "BUY_X_ITEMS_GET_PERCENT" && rule.thresholdQty) {
      const totalQty = items.reduce((s, i) => s + i.quantity, 0)
      qualifies = totalQty >= rule.thresholdQty
    }

    if (rule.ruleType === "BUY_X_GET_PERCENT" && rule.thresholdQty) {
      // qualifies if ANY single product has >= threshold qty
      const qtyByProduct: Record<string, number> = {}
      for (const item of items) {
        qtyByProduct[item.productId] = (qtyByProduct[item.productId] || 0) + item.quantity
      }
      qualifies = Object.values(qtyByProduct).some((q) => q >= (rule.thresholdQty ?? Infinity))
    }

    if (qualifies) {
      const saving = Math.round((subtotal * pct) / 100)
      if (!best || saving > best.savingAmount) {
        best = { id: rule.id, name: rule.name, discountPct: pct, savingAmount: saving }
      }
    }
  }

  return best
}
