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

type PriceRule = {
  id: string; name: string; type: string; productId: string | null
  tagName: string | null; minQty: number | null; discountType: string
  discountValue: number; isActive: boolean
  product: { id: string; name: string } | null
}

function emptyForm() {
  return { name: "", type: "TAG_DISCOUNT", productId: "", tagName: "", minQty: "", discountType: "PERCENTAGE", discountValue: "", isActive: true }
}

export default function PriceRulesClient({ data }: { data: PriceRule[] }) {
  const [rules, setRules] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PriceRule | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(r: PriceRule) {
    setEditing(r)
    setForm({
      name: r.name, type: r.type, productId: r.productId || "", tagName: r.tagName || "",
      minQty: r.minQty?.toString() || "", discountType: r.discountType,
      discountValue: r.discountValue.toString(), isActive: r.isActive,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.discountValue) { toast.error("Name and discount value required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/price-rules/${editing.id}` : "/api/admin/price-rules"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Rule updated" : "Rule created")
    setOpen(false)
    const listRes = await fetch("/api/admin/price-rules")
    setRules(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this price rule?")) return
    await fetch(`/api/admin/price-rules/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setRules(rs => rs.filter(r => r.id !== id))
  }

  async function toggleActive(r: PriceRule) {
    await fetch(`/api/admin/price-rules/${r.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...r, isActive: !r.isActive }),
    })
    setRules(rs => rs.map(x => x.id === r.id ? { ...x, isActive: !x.isActive } : x))
  }

  const typeLabel = (t: string) => ({ TAG_DISCOUNT: "Tag discount", QTY_TIER: "Qty tier", MEMBER_PRICE: "Member price" }[t] || t)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Rule</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Price Rule" : "Create Price Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VIP 15% off" />
            </div>
            <div>
              <label className="text-sm font-medium">Rule type</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v ?? form.type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TAG_DISCOUNT">Customer tag discount</SelectItem>
                  <SelectItem value="QTY_TIER">Quantity tier</SelectItem>
                  <SelectItem value="MEMBER_PRICE">Member price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "TAG_DISCOUNT" && (
              <div>
                <label className="text-sm font-medium">Customer tag</label>
                <Input value={form.tagName} onChange={e => setForm({ ...form, tagName: e.target.value })} placeholder="VIP" />
              </div>
            )}
            {form.type === "QTY_TIER" && (
              <div>
                <label className="text-sm font-medium">Minimum quantity</label>
                <Input type="number" value={form.minQty} onChange={e => setForm({ ...form, minQty: e.target.value })} placeholder="5" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Discount type</label>
                <Select value={form.discountType} onValueChange={v => setForm({ ...form, discountType: v ?? form.discountType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Discount value *</label>
                <Input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} placeholder="15" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Rule"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No price rules yet.</TableCell></TableRow>}
            {rules.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{typeLabel(r.type)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.tagName ? `Tag: ${r.tagName}` : r.minQty ? `Min qty: ${r.minQty}` : "—"}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {r.discountType === "PERCENTAGE" ? `${r.discountValue}%` : `৳${r.discountValue}`}
                </TableCell>
                <TableCell><Switch checked={r.isActive} onCheckedChange={() => toggleActive(r)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4" /></Button>
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
