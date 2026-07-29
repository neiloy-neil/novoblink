"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Product = { id: string; name: string }
type OrderBump = {
  id: string; productId: string; headline: string; description: string | null
  discountPct: number; triggerMinTotal: number | null; isActive: boolean; sortOrder: number
  product: { id: string; name: string; price: number; images: { url: string }[] }
}

function emptyForm() {
  return { productId: "", headline: "", description: "", discountPct: "0", triggerMinTotal: "", isActive: true, sortOrder: 0 }
}

export default function OrderBumpsClient({ data, products }: { data: OrderBump[]; products: Product[] }) {
  const [bumps, setBumps] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<OrderBump | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(b: OrderBump) {
    setEditing(b)
    setForm({
      productId: b.productId, headline: b.headline, description: b.description || "",
      discountPct: b.discountPct.toString(), triggerMinTotal: b.triggerMinTotal?.toString() || "",
      isActive: b.isActive, sortOrder: b.sortOrder,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.productId || !form.headline) { toast.error("Product and headline required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/order-bumps/${editing.id}` : "/api/admin/order-bumps"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Updated" : "Created")
    setOpen(false)
    const listRes = await fetch("/api/admin/order-bumps")
    setBumps(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this order bump?")) return
    await fetch(`/api/admin/order-bumps/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setBumps(bs => bs.filter(b => b.id !== id))
  }

  async function toggleActive(b: OrderBump) {
    await fetch(`/api/admin/order-bumps/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, isActive: !b.isActive }),
    })
    setBumps(bs => bs.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Order Bump</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Order Bump" : "Create Order Bump"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Product *</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                value={form.productId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, productId: e.target.value })}
              >
                <option value="">— select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Headline *</label>
              <Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Add matching socks for only ৳150!" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional short description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Discount %</label>
                <Input type="number" value={form.discountPct} onChange={e => setForm({ ...form, discountPct: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label className="text-sm font-medium">Min cart total (৳)</label>
                <Input type="number" value={form.triggerMinTotal} onChange={e => setForm({ ...form, triggerMinTotal: e.target.value })} placeholder="500 (optional)" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Headline</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min total</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bumps.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No order bumps yet.</TableCell></TableRow>}
            {bumps.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium text-sm">{b.product.name}</TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{b.headline}</TableCell>
                <TableCell className="text-sm">{b.discountPct > 0 ? `${b.discountPct}% off` : "—"}</TableCell>
                <TableCell className="text-sm">{b.triggerMinTotal ? `৳${b.triggerMinTotal}` : "—"}</TableCell>
                <TableCell><Switch checked={b.isActive} onCheckedChange={() => toggleActive(b)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
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
