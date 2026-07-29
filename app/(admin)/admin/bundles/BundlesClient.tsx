"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Pencil, Trash2, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

type Product = { id: string; name: string; price: number; images: { url: string }[] }
type BundleItem = { id: string; productId: string; quantity: number; sortOrder: number; product: Product }
type Bundle = {
  id: string; name: string; slug: string; description: string | null
  price: number; comparePrice: number | null; image: string | null
  type: string; minItems: number | null; maxItems: number | null
  discountPct: number | null; isActive: boolean; items: BundleItem[]
}

const empty = () => ({
  name: "", slug: "", description: "", price: "", comparePrice: "", image: "",
  type: "FIXED", minItems: "", maxItems: "", discountPct: "", isActive: true,
  items: [] as { productId: string; quantity: number }[],
})

export default function BundlesClient({ data, products }: { data: Bundle[]; products: Product[] }) {
  const [bundles, setBundles] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bundle | null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditing(null)
    setForm(empty())
    setOpen(true)
  }

  function openEdit(b: Bundle) {
    setEditing(b)
    setForm({
      name: b.name, slug: b.slug, description: b.description || "",
      price: String(b.price), comparePrice: b.comparePrice ? String(b.comparePrice) : "",
      image: b.image || "", type: b.type,
      minItems: b.minItems ? String(b.minItems) : "",
      maxItems: b.maxItems ? String(b.maxItems) : "",
      discountPct: b.discountPct ? String(b.discountPct) : "",
      isActive: b.isActive,
      items: b.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
    })
    setOpen(true)
  }

  function addItem() {
    if (products.length === 0) return
    setForm(f => ({ ...f, items: [...f.items, { productId: products[0].id, quantity: 1 }] }))
  }

  function updateItem(idx: number, field: "productId" | "quantity", val: string) {
    setForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: field === "quantity" ? Number(val) : val }
      return { ...f, items }
    })
  }

  function removeItem(idx: number) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error("Name and price are required"); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
    const url = editing ? `/api/admin/bundles/${editing.id}` : "/api/admin/bundles"
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save bundle"); return }
    toast.success(editing ? "Bundle updated" : "Bundle created")
    setOpen(false)
    // Refresh
    const listRes = await fetch("/api/admin/bundles")
    setBundles(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bundle?")) return
    const res = await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Failed to delete"); return }
    toast.success("Bundle deleted")
    setBundles(bs => bs.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Bundle</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Bundle" : "Create Bundle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bundle Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Summer Essentials" />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="summer-essentials" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Bundle Price (৳) *</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Compare Price (৳)</label>
                <Input type="number" value={form.comparePrice} onChange={e => setForm({ ...form, comparePrice: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Discount %</label>
                <Input type="number" value={form.discountPct} onChange={e => setForm({ ...form, discountPct: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v ?? form.type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed (curated set)</SelectItem>
                    <SelectItem value="PICK_N">Pick-N (customer chooses)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Cover Image URL</label>
                <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </div>
            </div>
            {form.type === "PICK_N" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Items</label>
                  <Input type="number" value={form.minItems} onChange={e => setForm({ ...form, minItems: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Items</label>
                  <Input type="number" value={form.maxItems} onChange={e => setForm({ ...form, maxItems: e.target.value })} />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Products in Bundle</label>
                <Button size="sm" variant="outline" onClick={addItem}><PlusCircle className="w-3 h-3 mr-1" />Add Product</Button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center p-2 border rounded-lg">
                    <select
                      className="flex-1 border border-input rounded-md px-2 py-1 text-sm bg-background"
                      value={item.productId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateItem(idx, "productId", e.target.value)}
                    >
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — ৳{Number(p.price).toLocaleString()}</option>)}
                    </select>
                    <Input
                      type="number" min="1" value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", e.target.value)}
                      className="w-16 text-center"
                    />
                    <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {form.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No products added yet</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active (visible in store)</label>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update Bundle" : "Create Bundle"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bundle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No bundles yet. Create your first one!</TableCell></TableRow>
            )}
            {bundles.map(b => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {b.image && <img src={b.image} alt={b.name} className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">/shop/bundle/{b.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline">{b.type}</Badge></TableCell>
                <TableCell className="font-mono font-medium">৳{Number(b.price).toLocaleString()}</TableCell>
                <TableCell>{b.items.length} products</TableCell>
                <TableCell><Badge variant={b.isActive ? "default" : "secondary"}>{b.isActive ? "Active" : "Draft"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <a href={`/shop/bundle/${b.slug}`} target="_blank" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"><ExternalLink className="w-4 h-4" /></a>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
