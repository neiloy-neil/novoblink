import prisma from "@/lib/prisma"

export type RiskLevel = "NEW" | "LOW" | "MEDIUM" | "HIGH"

export type CustomerRisk = {
  phone: string
  totalOrders: number
  delivered: number
  returnedOrCancelled: number
  pending: number
  successRate: number | null // null when not enough history to judge
  riskLevel: RiskLevel
}

const FAILED_STATUSES = ["CANCELLED", "RETURNED"] as const
const SETTLED_STATUSES = ["DELIVERED", "CANCELLED", "RETURNED"] as const

/**
 * Computes a phone number's delivery track record from our own order
 * history. No external API needed — this is the data we already have.
 */
export async function getCustomerRisk(phone: string): Promise<CustomerRisk> {
  const normalizedPhone = phone.trim()

  const orders = await prisma.order.findMany({
    where: { shippingPhone: normalizedPhone },
    select: { status: true },
  })

  const totalOrders = orders.length
  const delivered = orders.filter((o) => o.status === "DELIVERED").length
  const returnedOrCancelled = orders.filter((o) =>
    FAILED_STATUSES.includes(o.status as (typeof FAILED_STATUSES)[number])
  ).length
  const settled = orders.filter((o) =>
    SETTLED_STATUSES.includes(o.status as (typeof SETTLED_STATUSES)[number])
  ).length
  const pending = totalOrders - settled

  // Need at least 2 settled orders before we trust a success rate.
  const successRate = settled >= 2 ? delivered / settled : null

  let riskLevel: RiskLevel = "NEW"
  if (successRate !== null) {
    if (successRate >= 0.8) riskLevel = "LOW"
    else if (successRate >= 0.5) riskLevel = "MEDIUM"
    else riskLevel = "HIGH"
  }

  return {
    phone: normalizedPhone,
    totalOrders,
    delivered,
    returnedOrCancelled,
    pending,
    successRate,
    riskLevel,
  }
}

/** Batch version — avoids N+1 queries when rendering an admin order list. */
export async function getCustomerRiskBatch(phones: string[]): Promise<Map<string, CustomerRisk>> {
  const uniquePhones = Array.from(new Set(phones.map((p) => p.trim())))
  if (uniquePhones.length === 0) return new Map()

  const orders = await prisma.order.findMany({
    where: { shippingPhone: { in: uniquePhones } },
    select: { shippingPhone: true, status: true },
  })

  const byPhone = new Map<string, { status: string }[]>()
  for (const o of orders) {
    const list = byPhone.get(o.shippingPhone) ?? []
    list.push(o)
    byPhone.set(o.shippingPhone, list)
  }

  const result = new Map<string, CustomerRisk>()
  for (const phone of uniquePhones) {
    const phoneOrders = byPhone.get(phone) ?? []
    const totalOrders = phoneOrders.length
    const delivered = phoneOrders.filter((o) => o.status === "DELIVERED").length
    const returnedOrCancelled = phoneOrders.filter((o) =>
      FAILED_STATUSES.includes(o.status as (typeof FAILED_STATUSES)[number])
    ).length
    const settled = phoneOrders.filter((o) =>
      SETTLED_STATUSES.includes(o.status as (typeof SETTLED_STATUSES)[number])
    ).length
    const pending = totalOrders - settled
    const successRate = settled >= 2 ? delivered / settled : null

    let riskLevel: RiskLevel = "NEW"
    if (successRate !== null) {
      if (successRate >= 0.8) riskLevel = "LOW"
      else if (successRate >= 0.5) riskLevel = "MEDIUM"
      else riskLevel = "HIGH"
    }

    result.set(phone, { phone, totalOrders, delivered, returnedOrCancelled, pending, successRate, riskLevel })
  }

  return result
}
