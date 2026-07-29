"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Package, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"

export default function BundlesPage() {
  const [bundles, setBundles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch("/api/admin/bundles").then(r => r.json()).then(d => setBundles(d.bundles || [])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleActive = async (b: any) => {
    await fetch(`/api/admin/bundles/${b.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, isActive: !b.isActive, items: b.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) }),
    })
    load()
  }

  const deleteBundle = async (id: string) => {
    if (!confirm("Delete this bundle?")) return
    const res = await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Bundle deleted"); load() }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bundles</h1>
          <p className="text-sm text-muted-foreground">Create product bundles and combo deals</p>
        </div>
        <Link href="/admin/bundles/new">
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
            <Plus className="h-4 w-4" /> New Bundle
          </button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No bundles yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first combo deal</p>
          <Link href="/admin/bundles/new">
            <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">Create Bundle</button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bundles.map((b: any) => (
            <div key={b.id} className="flex items-center gap-4 border rounded-xl p-4 bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{b.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.isActive ? "Active" : "Draft"}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{b.type}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {b.items.length} product{b.items.length !== 1 ? "s" : ""} — ৳{Number(b.price).toLocaleString()}
                  {b.comparePrice ? ` (was ৳${Number(b.comparePrice).toLocaleString()})` : ""}
                </p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {b.items.map((item: any) => (
                    <span key={item.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {item.product?.name} ×{item.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(b)} className="text-muted-foreground hover:text-black transition-colors">
                  {b.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <Link href={`/admin/bundles/${b.id}`}>
                  <button className="text-muted-foreground hover:text-black transition-colors"><Pencil className="h-4 w-4" /></button>
                </Link>
                <button onClick={() => deleteBundle(b.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
