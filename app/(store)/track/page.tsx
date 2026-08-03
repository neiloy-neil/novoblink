"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Search, ShoppingBag, Check, Package, Truck, Home, Ban } from "lucide-react"
import { toast } from "sonner"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const

const STATUS_META: Record<string, { label: string; icon: any }> = {
  PENDING: { label: "Order Placed", icon: ShoppingBag },
  CONFIRMED: { label: "Confirmed", icon: Check },
  PACKED: { label: "Packed", icon: Package },
  SHIPPED: { label: "Shipped", icon: Truck },
  DELIVERED: { label: "Delivered", icon: Home },
}

export default function TrackOrderPage() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch("/api/store/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOrder(null)
        toast.error(data.error || "Order not found")
      } else {
        setOrder(data)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const currentIdx = order ? STATUS_STEPS.indexOf(order.status) : -1

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl animate-in fade-in duration-500">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-4">Track Your Order</h1>
        <p className="text-novo-text-muted">Enter your order number and phone number to check delivery status.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-novo-border rounded-2xl p-6 md:p-8 space-y-4 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Order Number</label>
            <input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-2026-0001"
              className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Phone Number</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-novo-blue transition-colors rounded-full text-xs disabled:opacity-50"
        >
          <Search className="w-4 h-4" /> {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {searched && !loading && !order && (
        <div className="text-center py-12 text-novo-text-muted">
          No order found with that order number and phone number. Double check and try again.
        </div>
      )}

      {order && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-widest text-novo-text-muted font-bold">Order</p>
                <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
              </div>
              <p className="text-sm text-novo-text-muted">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
            </div>

            {order.status === "CANCELLED" || order.status === "RETURNED" ? (
              <div className="flex items-center gap-3 text-novo-error">
                <Ban className="w-5 h-5" />
                <span className="font-bold">Order {order.status === "CANCELLED" ? "Cancelled" : "Returned"}</span>
              </div>
            ) : (
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-novo-border" />
                {STATUS_STEPS.map((step) => {
                  const isDone = currentIdx >= STATUS_STEPS.indexOf(step)
                  const Icon = STATUS_META[step].icon
                  return (
                    <div key={step} className="relative flex flex-col items-center gap-2 flex-1 z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isDone ? "bg-novo-blue border-novo-blue text-white" : "bg-white border-novo-border text-novo-text-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDone ? "text-novo-black" : "text-novo-text-muted"}`}>
                        {STATUS_META[step].label}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {order.delivery?.trackingCode && (
              <div className="mt-6 pt-6 border-t border-novo-border text-sm">
                <span className="text-novo-text-muted">Courier: </span>
                <span className="font-medium">{order.delivery.courier}</span>
                <span className="text-novo-text-muted"> · Tracking: </span>
                <span className="font-mono">{order.delivery.trackingCode}</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
            <h2 className="font-heading font-bold text-lg mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="relative h-16 w-12 bg-novo-muted shrink-0 rounded overflow-hidden">
                    {item.image && <Image src={item.image} alt={item.productName} fill sizes="48px" className="object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-novo-text-muted text-xs">{item.size} / {item.color} · Qty {item.quantity}</p>
                  </div>
                  <span className="font-mono text-sm">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-novo-border flex justify-between font-bold">
              <span>Total</span>
              <span className="font-mono">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
