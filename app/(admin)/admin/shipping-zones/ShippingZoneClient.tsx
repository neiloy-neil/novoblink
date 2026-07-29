"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MapPin } from "lucide-react"

type Zone = { id: string; name: string; districts: string; charge: number; freeShippingAbove: number | null; isActive: boolean; sortOrder: number }

const empty: Omit<Zone, "id"> = { name: "", districts: "", charge: 60, freeShippingAbove: null, isActive: true, sortOrder: 0 }

export default function ShippingZoneClient({ data }: { data: Zone[] }) {
  const router = useRouter()
  const [zones, setZones] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(null); setForm(empty); setOpen(true) }
  function openEdit(z: Zone) { setEditing(z); setForm({ name: z.name, districts: z.districts, charge: z.charge, freeShippingAbove: z.freeShippingAbove, isActive: z.isActive, sortOrder: z.sortOrder }); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/admin/shipping-zones/${editing.id}` : "/api/admin/shipping-zones"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editing ? "Zone updated" : "Zone created")
      setOpen(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shipping zone?")) return
    await fetch(`/api/admin/shipping-zones/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Add Zone</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" />{editing ? "Edit Zone" : "New Shipping Zone"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Zone Name</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dhaka City" required />
            </div>
            <div>
              <label className="text-sm font-medium">Districts (comma-separated)</label>
              <Input value={form.districts} onChange={e => setForm({ ...form, districts: e.target.value })} placeholder="Dhaka, Narayanganj, Gazipur" required />
              <p className="text-xs text-muted-foreground mt-1">Customer's district is matched against this list (case-insensitive).</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Delivery Charge (৳)</label>
                <Input type="number" min={0} value={form.charge} onChange={e => setForm({ ...form, charge: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Free Shipping Above (৳)</label>
                <Input type="number" min={0} value={form.freeShippingAbove ?? ""} onChange={e => setForm({ ...form, freeShippingAbove: e.target.value ? Number(e.target.value) : null })} placeholder="Leave blank to use global" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm font-medium">Active</label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving..." : "Save Zone"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Districts</TableHead>
              <TableHead>Charge</TableHead>
              <TableHead>Free Shipping Above</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No zones yet. The global shipping charge from Settings is used.</TableCell></TableRow>
            )}
            {zones.map(z => (
              <TableRow key={z.id}>
                <TableCell className="font-medium">{z.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{z.districts}</TableCell>
                <TableCell className="font-mono">৳{z.charge}</TableCell>
                <TableCell className="font-mono text-sm">{z.freeShippingAbove ? `৳${z.freeShippingAbove}` : <span className="text-muted-foreground">Global</span>}</TableCell>
                <TableCell><Badge variant={z.isActive ? "default" : "secondary"}>{z.isActive ? "Active" : "Disabled"}</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(z)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(z.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
