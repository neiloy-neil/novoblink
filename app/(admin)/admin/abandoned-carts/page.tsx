import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function AbandonedCartsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const carts = await prisma.abandonedCart.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const total = carts.reduce((s, c) => s + Number(c.subtotal), 0)
  const recovered = carts.filter(c => c.recoveredAt)
  const recoveredTotal = recovered.reduce((s, c) => s + Number(c.subtotal), 0)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Abandoned Carts</h1>
        <p className="text-sm text-muted-foreground mt-1">Carts abandoned without completing checkout.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 bg-white">
          <p className="text-sm text-muted-foreground">Total Abandoned</p>
          <p className="text-2xl font-bold mt-1">{carts.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">৳{total.toLocaleString()} at stake</p>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <p className="text-sm text-muted-foreground">Recovered</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{recovered.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">৳{recoveredTotal.toLocaleString()} recovered</p>
        </div>
        <div className="rounded-lg border p-4 bg-white">
          <p className="text-sm text-muted-foreground">Recovery Rate</p>
          <p className="text-2xl font-bold mt-1">{carts.length > 0 ? Math.round(recovered.length / carts.length * 100) : 0}%</p>
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Emails Sent</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {carts.length === 0 && <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No abandoned carts yet</td></tr>}
            {carts.map(cart => {
              const items = cart.items as any[]
              const emailsSent = [cart.email1SentAt, cart.email2SentAt, cart.email3SentAt].filter(Boolean).length
              return (
                <tr key={cart.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div>{cart.email || cart.phone || <span className="text-muted-foreground">Anonymous</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{items.length} item(s)</td>
                  <td className="px-4 py-3 font-mono font-medium">৳{Number(cart.subtotal).toLocaleString()}</td>
                  <td className="px-4 py-3">{emailsSent}/3</td>
                  <td className="px-4 py-3">
                    <Badge variant={cart.recoveredAt ? "default" : "secondary"}>
                      {cart.recoveredAt ? "Recovered" : "Abandoned"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(cart.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
