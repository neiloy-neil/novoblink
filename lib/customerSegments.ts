import prisma from "@/lib/prisma"

// Auto-assign segment tags based on purchase behaviour.
// Called after order placement and on-demand from admin.
export async function refreshCustomerSegments(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, status: { notIn: ["CANCELLED", "RETURNED"] } },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0)
  const orderCount = orders.length
  const daysSinceLastOrder = orders[0]
    ? (Date.now() - new Date(orders[0].createdAt).getTime()) / 86400000
    : Infinity

  const tags: string[] = []
  if (orderCount === 1 && daysSinceLastOrder < 30) tags.push("New")
  if (orderCount >= 3) tags.push("Loyal")
  if (totalSpent >= 10000) tags.push("VIP")
  if (orderCount >= 1 && daysSinceLastOrder > 60) tags.push("At Risk")
  if (orderCount === 0) tags.push("Never Ordered")

  // Remove old auto-segment tags and re-apply
  const autoTags = ["New", "Loyal", "VIP", "At Risk", "Never Ordered"]
  await prisma.customerTag.deleteMany({ where: { userId, tag: { in: autoTags } } })
  if (tags.length > 0) {
    await prisma.customerTag.createMany({
      data: tags.map(tag => ({ userId, tag })),
      skipDuplicates: true,
    })
  }
}
