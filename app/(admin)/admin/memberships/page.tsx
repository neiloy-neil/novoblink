import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import MembershipsClient from "./MembershipsClient"

export default async function MembershipsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const plans = await prisma.membershipPlan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: { sortOrder: "asc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Membership Plans</h1>
        <p className="text-sm text-muted-foreground mt-1">Create tiered membership plans with exclusive discounts and perks.</p>
      </div>
      <MembershipsClient data={JSON.parse(JSON.stringify(plans))} />
    </div>
  )
}
