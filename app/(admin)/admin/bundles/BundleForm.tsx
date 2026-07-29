"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X, Search } from "lucide-react"

type ProductOption = { id: string; name: string; image?: string }
type BundleItem = { productId: string; productName: string; quantity: number }

export default function BundleForm({ bundleId }: { bundleId?: string }) {
  const router = useRouter()
  const isEdit = !!bundleId

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [comparePrice, setComparePrice] = useState("")
  const [type, setType] = useState("FIXED")
  const [isActive, setIsActive] = useState(true)
  const [items, setItems] = useState<BundleItem[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ProductOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetch(`/api/admin/bundles/${bundleId}`).then(r => r.json()).then(d => {
        const b = d.bundle
        setName(b.name); setSlug(b.slug); setDescription(b.description || "")
        setPrice(String(b.price)); setComparePrice(String(b.comparePrice || ""))
        setType(b.type); setIsActive(b.isActive)
        setItems(b.items.map((i: any) => ({ productId: i.productId, productName: i.product?.name || "", quantity: i.quantity })))
      })
    }
  }, [bundleId])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(search)}&limit=8`)
        .then(r => r.json())
        .then(d => setSearchResults((d.products || []).map((p: any) => ({ id: p.id, name: p.name, image: p.images?.[0]?.url }))))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const addProduct = (p: ProductOption) => {
    if (items.find(i => i.productId === p.id)) return
    setItems(prev => [...prev, { productId: p.id, productName: p.name, quantity: 1 }])
    setSearch(""); setSearchResults([])
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.productId !== id))

  const handleSubmit = async () => {
    if (!name || !slug || !price || items.length < 2) {
      toast.error("Name, slug, price, and at least 2 products are required")
      return
    }
    setLoading(true)
    try {
      const body = { name, slug, description, price: Number(price), comparePrice: Number(comparePrice) || null, type, isActive, items }
      const res = await fetch(isEdit ? `/api/admin/bundles/${bundleId}` : "/api/admin/bundles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(isEdit ? "Bundle updated" : "Bundle created")
        router.push("/admin/bundles")
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save")
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Bundle" : "New Bundle"}</h1>
        <p className="text-sm text-muted-foreground">Create a combo deal with multiple products</p>
      </div>

      <div className="space-y-4 border rounded-xl p-5 bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Bundle Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); if (!isEdit) setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) }}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Summer Outfit Set" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug *</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="summer-outfit-set" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="FIXED">Fixed Bundle (all items)</option>
              <option value="PICK_N">Pick N (customer chooses)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Bundle Price (৳) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Compare Price (৳)</label>
            <input type="number" value={comparePrice} onChange={e => setComparePrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Original price" />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Describe the bundle..." />
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <input type="checkbox" id="active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
            <label htmlFor="active" className="text-sm font-medium">Active (visible in store)</label>
          </div>
        </div>
      </div>

      <div className="border rounded-xl p-5 bg-white space-y-4">
        <h3 className="font-semibold">Products in Bundle</h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm" placeholder="Search and add products..." />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {searchResults.map(p => (
                <button key={p.id} onClick={() => addProduct(p)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  {p.image && <img src={p.image} alt="" className="h-8 w-8 rounded object-cover" />}
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-3 border rounded-lg px-3 py-2">
              <span className="flex-1 text-sm">{item.productName}</span>
              <input type="number" min={1} value={item.quantity}
                onChange={e => setItems(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Number(e.target.value) } : i))}
                className="w-16 border rounded px-2 py-1 text-sm text-center" />
              <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Add at least 2 products</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Bundle"}
        </button>
      </div>
    </div>
  )
}
