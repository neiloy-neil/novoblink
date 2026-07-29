"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type CheckoutField = {
  id: string; label: string; placeholder: string | null; type: string
  options: string[]; isRequired: boolean; step: number; sortOrder: number; isActive: boolean
}

function emptyForm() {
  return { label: "", placeholder: "", type: "TEXT", options: "", isRequired: false, step: 1, sortOrder: 0, isActive: true }
}

const FIELD_TYPES = [
  { value: "TEXT", label: "Text input" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "SELECT", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "DATE", label: "Date picker" },
]

export default function CheckoutFieldsClient({ data }: { data: CheckoutField[] }) {
  const [fields, setFields] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CheckoutField | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(f: CheckoutField) {
    setEditing(f)
    setForm({
      label: f.label, placeholder: f.placeholder || "", type: f.type,
      options: Array.isArray(f.options) ? f.options.join(", ") : "",
      isRequired: f.isRequired, step: f.step, sortOrder: f.sortOrder, isActive: f.isActive,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.label) { toast.error("Label required"); return }
    setSaving(true)
    const payload = {
      ...form,
      options: form.options ? form.options.split(",").map(s => s.trim()).filter(Boolean) : [],
    }
    const url = editing ? `/api/admin/checkout-fields/${editing.id}` : "/api/admin/checkout-fields"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Field updated" : "Field created")
    setOpen(false)
    const listRes = await fetch("/api/admin/checkout-fields")
    setFields(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this field?")) return
    await fetch(`/api/admin/checkout-fields/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setFields(fs => fs.filter(f => f.id !== id))
  }

  async function toggleActive(f: CheckoutField) {
    await fetch(`/api/admin/checkout-fields/${f.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, isActive: !f.isActive }),
    })
    setFields(fs => fs.map(x => x.id === f.id ? { ...x, isActive: !x.isActive } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Field</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Checkout Field" : "Add Checkout Field"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Label *</label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Gift message" />
            </div>
            <div>
              <label className="text-sm font-medium">Placeholder</label>
              <Input value={form.placeholder} onChange={e => setForm({ ...form, placeholder: e.target.value })} placeholder="Write your gift message here..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Field type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v ?? form.type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Checkout step</label>
                <Input type="number" min={1} max={3} value={form.step} onChange={e => setForm({ ...form, step: Number(e.target.value) })} />
              </div>
            </div>
            {form.type === "SELECT" && (
              <div>
                <label className="text-sm font-medium">Options (comma-separated)</label>
                <Input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} placeholder="Option A, Option B, Option C" />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isRequired} onCheckedChange={v => setForm({ ...form, isRequired: v })} />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
                Active
              </label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Field"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No custom checkout fields yet.</TableCell></TableRow>}
            {fields.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.label}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{f.type}</Badge></TableCell>
                <TableCell className="text-sm">Step {f.step}</TableCell>
                <TableCell className="text-sm">{f.isRequired ? "Yes" : "No"}</TableCell>
                <TableCell><Switch checked={f.isActive} onCheckedChange={() => toggleActive(f)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="w-4 h-4" /></Button>
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
