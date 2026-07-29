"use client"
import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DraftOrderClient({ order }: { order: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    try {
      const res = await fetch(`/api/store/draft-orders/${order.id}/confirm`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Order confirmed!")
      router.push(`/order/${order.id}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8">
        <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full uppercase tracking-widest mb-3">Draft / Quote</span>
        <h1 className="text-2xl font-bold">Review Your Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Order #{order.orderNumber}</p>
      </div>

      <div className="border rounded-lg overflow-hidden mb-6">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-0">
            {item.product?.images?.[0]?.url && (
              <div className="relative w-14 h-14 shrink-0 rounded overflow-hidden bg-muted">
                <Image src={item.product.images[0].url} alt={item.productName} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{item.productName}</p>
              <p className="text-xs text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity}</p>
            </div>
            <span className="font-mono text-sm font-bold">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="p-4 bg-muted/50 flex justify-between font-bold">
          <span>Total</span>
          <span className="font-mono">৳{Number(order.total).toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-6 p-4 border rounded-lg text-sm">
        <p className="font-semibold mb-1">Shipping to:</p>
        <p>{order.shippingName} · {order.shippingPhone}</p>
        <p className="text-muted-foreground">{order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}</p>
      </div>

      <button
        onClick={confirm}
        disabled={loading}
        className="w-full py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition disabled:opacity-50"
      >
        {loading ? "Confirming..." : "Confirm & Place Order"}
      </button>
    </div>
  )
}
