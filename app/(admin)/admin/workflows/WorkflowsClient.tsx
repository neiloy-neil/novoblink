"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, Play } from "lucide-react"
import { toast } from "sonner"

const TRIGGERS = [
  { value: "ORDER_PLACED", label: "Order placed" },
  { value: "ORDER_STATUS_CHANGED", label: "Order status changed" },
  { value: "PAYMENT_RECEIVED", label: "Payment received" },
  { value: "REVIEW_LEFT", label: "Review left" },
  { value: "CUSTOMER_REGISTERED", label: "Customer registered" },
  { value: "ABANDONED_CART", label: "Cart abandoned" },
  { value: "RETURN_APPROVED", label: "Return approved" },
]

const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send email" },
  { value: "ADD_TAG", label: "Add customer tag" },
  { value: "REMOVE_TAG", label: "Remove customer tag" },
  { value: "ADD_STORE_CREDIT", label: "Issue store credit" },
  { value: "NOTIFY_ADMIN", label: "Notify admin" },
]

type Workflow = {
  id: string; name: string; description: string | null; trigger: string
  conditions: any[]; actions: any[]; isActive: boolean; runCount: number
  _count: { runs: number }
}

function emptyForm() {
  return { name: "", description: "", trigger: "ORDER_PLACED", conditions: [] as any[], actions: [] as any[], isActive: true }
}

export default function WorkflowsClient({ data }: { data: Workflow[] }) {
  const [workflows, setWorkflows] = useState(data)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(emptyForm()); setOpen(true) }
  function openEdit(w: Workflow) {
    setEditing(w)
    setForm({ name: w.name, description: w.description || "", trigger: w.trigger, conditions: w.conditions, actions: w.actions, isActive: w.isActive })
    setOpen(true)
  }

  function addAction() {
    setForm(f => ({ ...f, actions: [...f.actions, { type: "SEND_EMAIL", config: {} }] }))
  }
  function updateAction(idx: number, field: string, val: string) {
    setForm(f => {
      const actions = [...f.actions]
      if (field === "type") actions[idx] = { type: val, config: {} }
      else actions[idx] = { ...actions[idx], config: { ...actions[idx].config, [field]: val } }
      return { ...f, actions }
    })
  }
  function removeAction(idx: number) {
    setForm(f => ({ ...f, actions: f.actions.filter((_, i) => i !== idx) }))
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/workflows/${editing.id}` : "/api/admin/workflows"
    const method = editing ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to save"); return }
    toast.success(editing ? "Workflow updated" : "Workflow created")
    setOpen(false)
    const listRes = await fetch("/api/admin/workflows")
    setWorkflows(await listRes.json())
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow?")) return
    await fetch(`/api/admin/workflows/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    setWorkflows(ws => ws.filter(w => w.id !== id))
  }

  async function toggleActive(w: Workflow) {
    await fetch(`/api/admin/workflows/${w.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...w, isActive: !w.isActive }),
    })
    setWorkflows(ws => ws.map(x => x.id === w.id ? { ...x, isActive: !x.isActive } : x))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}><PlusCircle className="w-4 h-4 mr-2" />New Workflow</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Workflow" : "Create Workflow"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Workflow name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Send thank-you email after order" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Trigger</label>
                <Select value={form.trigger} onValueChange={v => setForm({ ...form, trigger: v ?? form.trigger })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Actions</label>
                <Button size="sm" variant="outline" onClick={addAction}><PlusCircle className="w-3 h-3 mr-1" />Add action</Button>
              </div>
              {form.actions.map((action, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Select value={action.type} onValueChange={v => updateAction(idx, "type", v ?? action.type)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <button onClick={() => removeAction(idx)} className="text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {action.type === "SEND_EMAIL" && (
                    <Input placeholder="Email message / note" value={action.config.message || ""} onChange={e => updateAction(idx, "message", e.target.value)} />
                  )}
                  {(action.type === "ADD_TAG" || action.type === "REMOVE_TAG") && (
                    <Input placeholder="Tag name (e.g. VIP)" value={action.config.tag || ""} onChange={e => updateAction(idx, "tag", e.target.value)} />
                  )}
                  {action.type === "ADD_STORE_CREDIT" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Amount (৳)" value={action.config.amount || ""} onChange={e => updateAction(idx, "amount", e.target.value)} />
                      <Input placeholder="Reason" value={action.config.reason || ""} onChange={e => updateAction(idx, "reason", e.target.value)} />
                    </div>
                  )}
                  {action.type === "NOTIFY_ADMIN" && (
                    <Input placeholder="Message to log" value={action.config.message || ""} onChange={e => updateAction(idx, "message", e.target.value)} />
                  )}
                </div>
              ))}
              {form.actions.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No actions yet — add at least one.</p>}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm({ ...form, isActive: v })} />
              <label className="text-sm">Active</label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create Workflow"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Runs</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No workflows yet.</TableCell></TableRow>}
            {workflows.map(w => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{TRIGGERS.find(t => t.value === w.trigger)?.label || w.trigger}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.actions.length} action{w.actions.length !== 1 ? "s" : ""}</TableCell>
                <TableCell className="text-sm">{w._count.runs}</TableCell>
                <TableCell><Switch checked={w.isActive} onCheckedChange={() => toggleActive(w)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(w)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(w.id)}><Trash2 className="w-4 h-4" /></Button>
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
