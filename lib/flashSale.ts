import prisma from "@/lib/prisma"

export type ActiveFlashSale = {
  id: string
  name: string
  discountType: string
  discountValue: number
  endsAt: Date
}

/**
 * Returns the active flash sale for a product (if any), checking
 * product-specific → category → sitewide in that priority order.
 */
export async function getActiveFlashSale(
  productId: string,
  categoryId: string
): Promise<ActiveFlashSale | null> {
  const now = new Date()
  const sale = await prisma.flashSale.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        { scope: "SITEWIDE" },
        { scope: "CATEGORY", categoryId },
        { scope: "PRODUCT", productId },
      ],
    },
    // product-specific takes priority over category, category over sitewide
    orderBy: [{ scope: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, discountType: true, discountValue: true, endsAt: true,
    },
  })

  if (!sale) return null
  return { ...sale, discountValue: Number(sale.discountValue) }
}

/**
 * Batch version for shop page — avoids N+1.
 * Returns a map of productId → active flash sale (or null).
 */
export async function getActiveFlashSaleBatch(
  products: Array<{ id: string; categoryId: string }>
): Promise<Map<string, ActiveFlashSale | null>> {
  const now = new Date()
  const productIds = products.map((p) => p.id)
  const categoryIds = Array.from(new Set(products.map((p) => p.categoryId)))

  const sales = await prisma.flashSale.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
      OR: [
        { scope: "SITEWIDE" },
        { scope: "CATEGORY", categoryId: { in: categoryIds } },
        { scope: "PRODUCT", productId: { in: productIds } },
      ],
    },
    orderBy: [{ scope: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, discountType: true, discountValue: true,
      endsAt: true, scope: true, productId: true, categoryId: true,
    },
  })

  const result = new Map<string, ActiveFlashSale | null>()
  const sitewide = sales.find((s) => s.scope === "SITEWIDE")

  for (const p of products) {
    const productSale = sales.find((s) => s.scope === "PRODUCT" && s.productId === p.id)
    const categorySale = sales.find((s) => s.scope === "CATEGORY" && s.categoryId === p.categoryId)
    const best = productSale ?? categorySale ?? sitewide ?? null
    result.set(p.id, best ? { ...best, discountValue: Number(best.discountValue) } : null)
  }
  return result
}

/** Applies a flash sale discount to a price. */
export function applyFlashSaleDiscount(
  price: number,
  sale: ActiveFlashSale | null
): number {
  if (!sale) return price
  if (sale.discountType === "PERCENTAGE") {
    return Math.max(0, price - Math.round((price * sale.discountValue) / 100))
  }
  return Math.max(0, price - sale.discountValue)
}
