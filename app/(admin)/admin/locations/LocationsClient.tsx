"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Pencil, Trash2, Star } from "lucide-react"
import { toast } from "sonner"

type Location = { id: string; name: string; address: string | null; phone: string | null; isActive: boolean; isDefault: boolean; _count?: { stock: number } }

function emptyForm() {
  return { name: "", address: "", phone: "", isActive: true, isDefault: false }
}

export default function LocationsClient({ data }: { data: Location[] }) {
  const [locations, setLocations] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(l: Location) {
    setEditing(l)
    setForm({ name: l.name, address: l.address || "", phone: l.phone || "", isActive: l.isActive, isDefault: l.isDefault })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/locations/${editing.id}` : "/api/admin/locations"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed"); return }
    toast.success(editing ? "Updated" : "Created")
    setOpen(false)
    const listRes = await fetch("/api/admin/locations")
    setLocations(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this location? All location stock will be removed.")) return
    await fetch(`/api/admin/locations/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setLocations(ls => ls.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />Add Location</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><label className="text-sm font-medium">Location name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Gulshan Warehouse" /></div>
            <div><label className="text-sm font-medium">Address</label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Road 12, Gulshan-1, Dhaka" /></div>
            <div><label className="text-sm font-medium">Phone</label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />Active</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={form.isDefault} onCheckedChange={v => setForm({ ...form, isDefault: v })} />Default</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Location"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>SKUs tracked</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No locations yet.</TableCell></TableRow>}
            {locations.map(l => (
              <TableRow key={l.id}>
                <TableCell className="font-medium flex items-center gap-1.5">
                  {l.isDefault && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  {l.name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.address || "—"}</TableCell>
                <TableCell className="text-sm">{l._count?.stock ?? 0}</TableCell>
                <TableCell><Badge variant={l.isActive ? "default" : "secondary"}>{l.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="w-4 h-4" /></Button>
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
