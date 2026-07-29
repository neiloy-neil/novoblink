"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, Check } from "lucide-react"
import { toast } from "sonner"

type MembershipPlan = {
  id: string; name: string; slug: string; description: string | null; price: number
  billingCycle: string; discountPct: number; freeShipping: boolean; exclusiveAccess: boolean
  benefits: string[]; isActive: boolean; sortOrder: number
  _count?: { subscriptions: number }
}

function emptyForm() {
  return {
    name: "", description: "", price: "", billingCycle: "MONTHLY",
    discountPct: "0", freeShipping: false, exclusiveAccess: false,
    benefits: "", isActive: true, sortOrder: 0,
  }
}

export default function MembershipsClient({ data }: { data: MembershipPlan[] }) {
  const [plans, setPlans] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MembershipPlan | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(p: MembershipPlan) {
    setEditing(p)
    setForm({
      name: p.name, description: p.description || "", price: p.price.toString(),
      billingCycle: p.billingCycle, discountPct: p.discountPct.toString(),
      freeShipping: p.freeShipping, exclusiveAccess: p.exclusiveAccess,
      benefits: Array.isArray(p.benefits) ? p.benefits.join("\n") : "",
      isActive: p.isActive, sortOrder: p.sortOrder,
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error("Name and price required"); return }
    setSaving(true)
    const payload = {
      ...form,
      benefits: form.benefits ? form.benefits.split("\n").map(s => s.trim()).filter(Boolean) : [],
    }
    const url = editing ? `/api/admin/memberships/${editing.id}` : "/api/admin/memberships"
    const method = editing ? "PATCH" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Plan updated" : "Plan created")
    setOpen(false)
    const listRes = await fetch("/api/admin/memberships")
    setPlans(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this membership plan?")) return
    await fetch(`/api/admin/memberships/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setPlans(ps => ps.filter(p => p.id !== id))
  }

  async function toggleActive(p: MembershipPlan) {
    await fetch(`/api/admin/memberships/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, isActive: !p.isActive }),
    })
    setPlans(ps => ps.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x))
  }

  const cycleLabel = (c: string) => ({ MONTHLY: "Monthly", YEARLY: "Yearly", LIFETIME: "Lifetime" }[c] || c)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Plan</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Plan" : "Create Membership Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Plan name *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="NovoBlink Club Gold" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Price (৳) *</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="499" />
              </div>
              <div>
                <label className="text-sm font-medium">Billing cycle</label>
                <Select value={form.billingCycle} onValueChange={v => setForm({ ...form, billingCycle: v ?? form.billingCycle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                    <SelectItem value="LIFETIME">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Product discount %</label>
              <Input type="number" value={form.discountPct} onChange={e => setForm({ ...form, discountPct: e.target.value })} placeholder="10" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.freeShipping} onCheckedChange={v => setForm({ ...form, freeShipping: v })} />
                Free shipping
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.exclusiveAccess} onCheckedChange={v => setForm({ ...form, exclusiveAccess: v })} />
                Exclusive access
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Benefits (one per line)</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                value={form.benefits}
                onChange={e => setForm({ ...form, benefits: e.target.value })}
                placeholder={"10% off all products\nFree shipping on all orders\nEarly access to new arrivals"}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update Plan" : "Create Plan"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {plans.map(p => (
          <div key={p.id} className="border rounded-xl p-4 bg-white space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{cycleLabel(p.billingCycle)}</p>
              </div>
              <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="text-2xl font-bold">৳{p.price}</p>
            <ul className="text-sm space-y-1">
              {Array.isArray(p.benefits) && p.benefits.map((b, i) => (
                <li key={i} className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="w-3 h-3 text-green-500 shrink-0" />{b}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">{p._count?.subscriptions ?? 0} active subscribers</p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
              <Switch checked={p.isActive} onCheckedChange={() => toggleActive(p)} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">No membership plans yet. Create your first plan above.</div>
      )}
    </div>
  )
}
