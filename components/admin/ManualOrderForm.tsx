"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Trash2, AlertTriangle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import type { CustomerRisk } from "@/lib/customerRisk"

type Variant = {
  id: string
  size: string
  color: string
  stock: number
  price: string | null
}

type Product = {
  id: string
  name: string
  price: string
  images: { url: string }[]
  variants: Variant[]
}

type LineItem = {
  productId: string
  variantId: string
  name: string
  size: string
  color: string
  price: number
  quantity: number
  stock: number
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
}

export default function ManualOrderForm() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [items, setItems] = useState<LineItem[]>([])

  const [address, setAddress] = useState({
    name: "", phone: "", division: "", district: "", area: "", fullAddress: "",
  })
  const [paymentMethod, setPaymentMethod] = useState("COD")
  const [markPaid, setMarkPaid] = useState(false)
  const [shippingCharge, setShippingCharge] = useState("60")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [risk, setRisk] = useState<CustomerRisk | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d) ? d : []))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (address.phone.trim().length < 6) {
      setRisk(null)
      return
    }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/admin/customers/risk?phone=${encodeURIComponent(address.phone)}`)
        .then((r) => r.json())
        .then(setRisk)
        .catch(() => setRisk(null))
    }, 400)
  }, [address.phone])

  function addVariant(product: Product, variant: Variant) {
    const existing = items.find((i) => i.variantId === variant.id)
    if (existing) {
      setItems(items.map((i) => (i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i)))
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          size: variant.size,
          color: variant.color,
          price: Number(variant.price ?? product.price),
          quantity: 1,
          stock: variant.stock,
        },
      ])
    }
    toast.success(`Added ${product.name} (${variant.size}/${variant.color})`)
  }

  function updateQty(variantId: string, qty: number) {
    if (qty < 1) return
    setItems(items.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)))
  }

  function removeItem(variantId: string) {
    setItems(items.filter((i) => i.variantId !== variantId))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal + (Number(shippingCharge) || 0)

  async function handleSubmit(asDraft = false) {
    if (items.length === 0) {
      toast.error("Add at least one product")
      return
    }
    if (!asDraft && (!address.name || !address.phone)) {
      toast.error("Customer name and phone are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, address, paymentMethod, shippingCharge, note, markPaid, asDraft }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create order")
        return
      }
      toast.success(asDraft ? "Draft saved" : "Order created")
      router.push(`/admin/orders/${data.orderId}`)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Add Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {searching && <p className="text-sm text-muted-foreground">Searching...</p>}
            {results.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto border rounded-md p-3">
                {results.map((product) => (
                  <div key={product.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="h-14 w-12 bg-muted rounded shrink-0 overflow-hidden">
                      {product.images[0]?.url && (
                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">৳{Number(product.price).toLocaleString()}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            disabled={v.stock === 0}
                            onClick={() => addVariant(product, v)}
                            className="text-[11px] border rounded-full px-2.5 py-1 hover:border-black disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {v.size}/{v.color} ({v.stock})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                {items.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.size} / {item.color} · ৳{item.price}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => updateQty(item.variantId, Number(e.target.value))}
                      className="w-16 h-8"
                    />
                    <span className="font-mono w-20 text-right">৳{(item.price * item.quantity).toLocaleString()}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.variantId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer & Shipping</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Full Name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
              <Input placeholder="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
              <Input placeholder="Division" value={address.division} onChange={(e) => setAddress({ ...address, division: e.target.value })} />
              <Input placeholder="District" value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
              <Input placeholder="Area / Thana" value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} className="col-span-2" />
              <Input placeholder="Full Address" value={address.fullAddress} onChange={(e) => setAddress({ ...address, fullAddress: e.target.value })} className="col-span-2" />
            </div>

            {risk && risk.riskLevel !== "NEW" && (
              <div className={`p-3 rounded-md border text-xs flex items-center gap-2 ${RISK_COLORS[risk.riskLevel]}`}>
                {risk.riskLevel === "HIGH" ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
                <span>
                  <strong>{risk.riskLevel} risk</strong> — {risk.delivered} delivered / {risk.returnedOrCancelled} returned
                  {" "}({Math.round((risk.successRate ?? 0) * 100)}% success, {risk.totalOrders} past orders)
                </span>
              </div>
            )}

            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v || "COD")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shipping Charge (৳)</label>
              <Input type="number" min="0" value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
              Already paid (mark as PAID)
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>৳{(Number(shippingCharge) || 0).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span>৳{total.toLocaleString()}</span></div>
            <Button className="w-full mt-4" disabled={submitting} onClick={() => handleSubmit(false)}>
              {submitting ? "Creating..." : "Create Order"}
            </Button>
            <Button variant="outline" className="w-full mt-2" disabled={submitting} onClick={() => handleSubmit(true)}>
              Save as Draft
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
