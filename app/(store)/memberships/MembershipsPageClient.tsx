"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Plan = {
  id: string; name: string; description: string | null; price: number
  billingCycle: string; discountPct: number; freeShipping: boolean
  exclusiveAccess: boolean; benefits: string[]
}

type ActiveSub = { planId: string; plan: Plan; expiresAt: string | null } | null

export default function MembershipsPageClient({ plans, activeSub }: { plans: Plan[]; activeSub: ActiveSub }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const cycleLabel = (c: string) => ({ MONTHLY: "/month", YEARLY: "/year", LIFETIME: " one-time" }[c] || "")

  async function handleSubscribe(planId: string) {
    setLoading(planId)
    const res = await fetch("/api/store/memberships/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    })
    setLoading(null)
    if (res.status === 401) { router.push("/login"); return }
    if (!res.ok) { toast.error("Failed to subscribe"); return }
    toast.success("Membership activated!")
    router.refresh()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold">NovoBlink Membership</h1>
        <p className="text-muted-foreground mt-2">Unlock exclusive discounts, free shipping and early access to new drops.</p>
      </div>

      {activeSub && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="font-semibold text-green-800">You are a <span className="font-bold">{activeSub.plan.name}</span> member</p>
          {activeSub.expiresAt && (
            <p className="text-sm text-green-600 mt-1">Renews on {new Date(activeSub.expiresAt).toLocaleDateString("en-BD")}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const isCurrent = activeSub?.planId === plan.id
          return (
            <div key={plan.id} className={`border rounded-2xl p-6 flex flex-col relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}>
              {isCurrent && <Badge className="absolute top-3 right-3 bg-primary">Current plan</Badge>}
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
              <div className="mb-4">
                <span className="text-3xl font-extrabold">৳{plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">{cycleLabel(plan.billingCycle)}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
                {plan.discountPct > 0 && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    {plan.discountPct}% off all products
                  </li>
                )}
                {plan.freeShipping && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    Free shipping on all orders
                  </li>
                )}
              </ul>
              <Button
                className="w-full"
                variant={isCurrent ? "outline" : "default"}
                disabled={isCurrent || loading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading === plan.id ? "Processing..." : isCurrent ? "Current plan" : "Subscribe"}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
