"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type Brand = {
  id: string; name: string; slug: string; logo: string | null
  description: string | null; website: string | null; isActive: boolean
  sortOrder: number; _count?: { products: number }
}

function emptyForm() {
  return { name: "", slug: "", logo: "", description: "", website: "", isActive: true, sortOrder: 0 }
}

export default function BrandsClient({ data }: { data: Brand[] }) {
  const [brands, setBrands] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(b: Brand) {
    setEditing(b)
    setForm({ name: b.name, slug: b.slug, logo: b.logo || "", description: b.description || "", website: b.website || "", isActive: b.isActive, sortOrder: b.sortOrder })
    setOpen(true)
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/brands/${editing.id}` : "/api/admin/brands"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Brand updated" : "Brand created")
    setOpen(false)
    const listRes = await fetch("/api/admin/brands")
    setBrands(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this brand?")) return
    await fetch(`/api/admin/brands/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setBrands(bs => bs.filter(b => b.id !== id))
  }

  async function toggleActive(b: Brand) {
    await fetch(`/api/admin/brands/${b.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, isActive: !b.isActive }),
    })
    setBrands(bs => bs.map(x => x.id === b.id ? { ...x, isActive: !x.isActive } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Brand</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Brand" : "Create Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={e => {
                const name = e.target.value
                setForm(f => ({ ...f, name, slug: f.slug || autoSlug(name) }))
              }} placeholder="PUMA" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="puma" />
            </div>
            <div>
              <label className="text-sm font-medium">Logo URL</label>
              <Input value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://puma.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Sort order</label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Brand"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No brands yet.</TableCell></TableRow>}
            {brands.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {b.logo && <img src={b.logo} alt={b.name} className="w-6 h-6 object-contain rounded" />}
                  {b.name}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-xs font-mono">{b.slug}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{b._count?.products ?? "—"}</TableCell>
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
