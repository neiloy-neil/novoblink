import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProductAnalyticsClient from "./ProductAnalyticsClient"

export default async function ProductAnalyticsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Product Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue, units sold and conversion rates per product.</p>
      </div>
      <ProductAnalyticsClient />
    </div>
  )
}
