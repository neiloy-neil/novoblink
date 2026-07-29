import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import CohortClient from "./CohortClient"

export default async function CohortPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Customer Cohort & LTV</h1>
        <p className="text-sm text-muted-foreground mt-1">Lifetime value, RFM segmentation and purchase frequency for every customer.</p>
      </div>
      <CohortClient />
    </div>
  )
}
