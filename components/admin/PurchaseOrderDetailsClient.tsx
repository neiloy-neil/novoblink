"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  RECEIVED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

export default function PurchaseOrderDetailsClient({ initialPO }: { initialPO: any }) {
  const router = useRouter()
  const [po, setPo] = useState(initialPO)
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: "RECEIVED" | "CANCELLED") {
    if (status === "RECEIVED" && !confirm("Mark as received? This will add stock to inventory and cannot be undone.")) return
    if (status === "CANCELLED" && !confirm("Cancel this purchase order?")) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (res.ok) {
        setPo({ ...po, status: data.purchaseOrder.status })
        toast.success(status === "RECEIVED" ? "Stock updated and PO marked received" : "Purchase order cancelled")
        router.refresh()
      } else {
        toast.error(data.error || "Failed to update")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{po.poNumber}</h1>
          <p className="text-muted-foreground">{po.supplier.name} · {new Date(po.createdAt).toLocaleDateString("en-BD")}</p>
        </div>
        <Badge variant="outline" className={STATUS_COLORS[po.status]}>{po.status}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {po.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.variant.product.name}</p>
                  <p className="text-sm text-muted-foreground">{item.variant.size} / {item.variant.color}</p>
                </div>
                <div className="text-right">
                  <p>৳{item.costPrice} x {item.quantity}</p>
                  <p className="font-bold">৳{(item.costPrice * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-between font-bold text-lg">
            <span>Total Cost</span>
            <span>৳{Number(po.totalCost).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {po.note && (
        <Card>
          <CardHeader><CardTitle>Note</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{po.note}</CardContent>
        </Card>
      )}

      {po.status === "PENDING" && (
        <div className="flex gap-3">
          <Button disabled={loading} onClick={() => updateStatus("RECEIVED")}>
            Mark as Received
          </Button>
          <Button variant="destructive" disabled={loading} onClick={() => updateStatus("CANCELLED")}>
            Cancel Order
          </Button>
        </div>
      )}
    </div>
  )
}
