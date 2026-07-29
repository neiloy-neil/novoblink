import prisma from "@/lib/prisma"

export async function resolveShippingCharge(district: string, subtotal: number): Promise<number> {
  const zones = await prisma.shippingZone.findMany({ where: { isActive: true } })
  const matched = zones.find(z =>
    z.districts.split(",").map(d => d.trim().toLowerCase()).includes(district.trim().toLowerCase())
  )

  if (matched) {
    const freeAbove = matched.freeShippingAbove ? Number(matched.freeShippingAbove) : null
    if (freeAbove !== null && subtotal >= freeAbove) return 0
    return Number(matched.charge)
  }

  // Fall back to global setting
  const globalSetting = await prisma.setting.findUnique({ where: { key: "shipping_charge" } })
  const globalFree = await prisma.setting.findUnique({ where: { key: "free_shipping_above" } })
  const freeAbove = Number(globalFree?.value || 1000)
  if (subtotal >= freeAbove) return 0
  return Number(globalSetting?.value || 60)
}
