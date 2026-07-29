"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Variant = { id: string; size: string; color: string; price: string | null }
type Product = { id: string; name: string; price: string; images: { url: string }[]; variants: Variant[] }
type LineItem = {
  variantId: string
  productName: string
  size: string
  color: string
  quantity: number
  costPrice: number
}

export default function NewPurchaseOrderForm({ suppliers }: { suppliers: { id: string; name: string }[] }) {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "")
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [items, setItems] = useState<LineItem[]>([])
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([])
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(search)}`)
        .then((r) => r.json())
        .then((d) => setResults(Array.isArray(d) ? d : []))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  function addVariant(product: Product, variant: Variant) {
    if (items.some((i) => i.variantId === variant.id)) {
      toast.error("Already added — adjust quantity below")
      return
    }
    setItems([
      ...items,
      {
        variantId: variant.id,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        quantity: 1,
        costPrice: Number(variant.price ?? product.price) * 0.6, // rough starting estimate, admin adjusts
      },
    ])
  }

  function updateItem(variantId: string, field: "quantity" | "costPrice", value: number) {
    setItems(items.map((i) => (i.variantId === variantId ? { ...i, [field]: value } : i)))
  }

  function removeItem(variantId: string) {
    setItems(items.filter((i) => i.variantId !== variantId))
  }

  const totalCost = items.reduce((s, i) => s + i.costPrice * i.quantity, 0)

  async function handleSubmit() {
    if (!supplierId) {
      toast.error("Select a supplier")
      return
    }
    if (items.length === 0) {
      toast.error("Add at least one item")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, note }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to create purchase order")
        return
      }
      toast.success("Purchase order created")
      router.push(`/admin/purchase-orders/${data.purchaseOrder.id}`)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">Add a supplier first before creating a purchase order.</p>
          <Link href="/admin/suppliers"><Button>Go to Suppliers</Button></Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Supplier</CardTitle></CardHeader>
          <CardContent>
            <Select value={supplierId} onValueChange={(v) => setSupplierId(v || "")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add Items</CardTitle></CardHeader>
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
            {results.length > 0 && (
              <div className="space-y-3 max-h-72 overflow-y-auto border rounded-md p-3">
                {results.map((product) => (
                  <div key={product.id} className="flex gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="h-14 w-12 bg-muted rounded shrink-0 overflow-hidden">
                      {product.images[0]?.url && (
                        <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {product.variants.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => addVariant(product, v)}
                            className="text-[11px] border rounded-full px-2.5 py-1 hover:border-black"
                          >
                            {v.size}/{v.color}
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
                  <div key={item.variantId} className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.size} / {item.color}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.variantId, "quantity", Number(e.target.value))}
                        className="w-16 h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Cost/unit (৳)</label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.costPrice}
                        onChange={(e) => updateItem(item.variantId, "costPrice", Number(e.target.value))}
                        className="w-24 h-8"
                      />
                    </div>
                    <span className="font-mono w-20 text-right">৳{(item.costPrice * item.quantity).toLocaleString()}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.variantId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total Cost</span>
              <span>৳{totalCost.toLocaleString()}</span>
            </div>
            <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Creating..." : "Create Purchase Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
