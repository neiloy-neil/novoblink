import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import PriceRulesClient from "./PriceRulesClient"

export default async function PriceRulesPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const rules = await prisma.priceRule.findMany({
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dynamic Pricing Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">Tag-based and quantity-tier discounts applied automatically at checkout.</p>
      </div>
      <PriceRulesClient data={JSON.parse(JSON.stringify(rules))} />
    </div>
  )
}
