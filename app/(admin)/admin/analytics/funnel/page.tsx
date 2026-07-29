import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"

async function getFunnelData(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const events = await prisma.funnelEvent.groupBy({
    by: ["event"],
    where: { createdAt: { gte: since } },
    _count: { event: true },
  }).catch(() => [])

  const map = Object.fromEntries(events.map(e => [e.event, e._count.event]))
  return {
    product_view: map.product_view || 0,
    add_to_cart: map.add_to_cart || 0,
    checkout_start: map.checkout_start || 0,
    checkout_complete: map.checkout_complete || 0,
  }
}

export default async function FunnelPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")

  const data30 = await getFunnelData(30)

  const steps = [
    { label: "Product Views", count: data30.product_view, color: "bg-blue-500" },
    { label: "Add to Cart", count: data30.add_to_cart, color: "bg-yellow-500" },
    { label: "Checkout Started", count: data30.checkout_start, color: "bg-orange-500" },
    { label: "Orders Completed", count: data30.checkout_complete, color: "bg-green-500" },
  ]

  const pct = (a: number, b: number) => b > 0 ? `${Math.round((a / b) * 100)}%` : "-"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Conversion Funnel</h1>
        <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div key={step.label} className="border rounded-lg p-5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{step.label}</p>
            <p className="text-3xl font-bold">{step.count.toLocaleString()}</p>
            {i > 0 && (
              <p className="text-xs text-muted-foreground">
                {pct(step.count, steps[i - 1].count)} of previous step
              </p>
            )}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${step.color} rounded-full transition-all`}
                style={{ width: steps[0].count > 0 ? `${Math.min(100, (step.count / steps[0].count) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>
            <th className="px-4 py-2 text-left">Stage</th>
            <th className="px-4 py-2 text-right">Count</th>
            <th className="px-4 py-2 text-right">Conversion from prev</th>
          </tr></thead>
          <tbody>
            {steps.map((step, i) => (
              <tr key={step.label} className="border-t">
                <td className="px-4 py-2 font-medium">{step.label}</td>
                <td className="px-4 py-2 text-right">{step.count.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {i === 0 ? "-" : pct(step.count, steps[i - 1].count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
