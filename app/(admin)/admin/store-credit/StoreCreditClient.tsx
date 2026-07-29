"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, MinusCircle } from "lucide-react"
import { toast } from "sonner"

type Credit = { id: string; userId: string; balance: number; user: { name: string | null; email: string } }
type Customer = { id: string; name: string | null; email: string }

export default function StoreCreditClient({ data, customers }: { data: Credit[]; customers: Customer[] }) {
  const [credits, setCredits] = useState(data)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ userId: "", amount: "", reason: "", type: "CREDIT" })
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!form.userId || !form.amount) { toast.error("Customer and amount required"); return }
    setSaving(true)
    const res = await fetch("/api/admin/store-credit", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to update store credit"); return }
    toast.success(`Store credit ${form.type === "CREDIT" ? "issued" : "deducted"}`)
    setOpen(false)
    const listRes = await fetch("/api/admin/store-credit")
    setCredits(await listRes.json())
  }

  const totalOutstanding = credits.reduce((s, c) => s + Number(c.balance), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-muted/40 rounded-xl p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Customers with credit</div><div className="text-2xl font-bold mt-1">{credits.length}</div></div>
        <div className="bg-muted/40 rounded-xl p-4"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total outstanding</div><div className="text-2xl font-bold mt-1">৳{totalOutstanding.toLocaleString()}</div></div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><PlusCircle className="w-4 h-4 mr-2" />Issue / Adjust Credit</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue / Adjust Store Credit</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Customer</label>
              <Select value={form.userId} onValueChange={v => setForm({ ...form, userId: v ?? form.userId })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name || c.email} — {c.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v ?? form.type })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT">Add credit</SelectItem>
                    <SelectItem value="DEBIT">Deduct credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount (৳)</label>
                <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="200" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason</label>
              <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Refund goodwill / Loyalty reward" />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : "Apply"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No store credits issued yet.</TableCell></TableRow>}
            {credits.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.user.name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.user.email}</TableCell>
                <TableCell className={`font-mono font-bold ${Number(c.balance) > 0 ? "text-green-700" : "text-muted-foreground"}`}>৳{Number(c.balance).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
