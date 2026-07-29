"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PlusCircle, Copy, Check } from "lucide-react"
import { toast } from "sonner"

type GiftCard = {
  id: string; code: string; amount: number; balance: number
  senderName: string | null; senderEmail: string | null; recipientEmail: string
  message: string | null; isActive: boolean; expiresAt: string | null; createdAt: string
}

const empty = () => ({
  recipientEmail: "", recipientName: "", senderName: "", amount: "", message: "",
  expiresAt: "", sendEmail: true,
})

export default function GiftCardsClient({ data }: { data: GiftCard[] }) {
  const [cards, setCards] = useState(data)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function handleCreate() {
    if (!form.recipientEmail || !form.amount) { toast.error("Recipient email and amount required"); return }
    setSaving(true)
    const res = await fetch("/api/admin/gift-cards", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    })
    setSaving(false)
    if (!res.ok) { toast.error("Failed to create gift card"); return }
    toast.success("Gift card created and email sent!")
    setOpen(false)
    setForm(empty())
    const listRes = await fetch("/api/admin/gift-cards")
    setCards(await listRes.json())
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/gift-cards/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) })
    setCards(cs => cs.map(c => c.id === id ? { ...c, isActive } : c))
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const totalIssued = cards.reduce((s, c) => s + Number(c.amount), 0)
  const totalBalance = cards.reduce((s, c) => s + Number(c.balance), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Cards issued", value: cards.length },
          { label: "Total value issued", value: `৳${totalIssued.toLocaleString()}` },
          { label: "Outstanding balance", value: `৳${totalBalance.toLocaleString()}` },
        ].map(m => (
          <div key={m.label} className="bg-muted/40 rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{m.label}</div>
            <div className="text-2xl font-bold mt-1">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><PlusCircle className="w-4 h-4 mr-2" />Issue Gift Card</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Gift Card</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium">Recipient email *</label>
              <Input value={form.recipientEmail} onChange={e => setForm({ ...form, recipientEmail: e.target.value })} placeholder="customer@email.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Recipient name</label>
              <Input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })} placeholder="Ayesha" />
            </div>
            <div>
              <label className="text-sm font-medium">From (sender name)</label>
              <Input value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} placeholder="Rahim" />
            </div>
            <div>
              <label className="text-sm font-medium">Amount (৳) *</label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" />
            </div>
            <div>
              <label className="text-sm font-medium">Personal message</label>
              <Input value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Happy Birthday!" />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry date (optional)</label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.sendEmail} onCheckedChange={v => setForm({ ...form, sendEmail: v })} />
              <label className="text-sm">Send gift card email to recipient</label>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Issue Gift Card"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No gift cards yet.</TableCell></TableRow>}
            {cards.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm font-bold">{c.code}</code>
                    <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                      {copied === c.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{c.recipientEmail}</div>
                  {c.senderName && <div className="text-xs text-muted-foreground">from {c.senderName}</div>}
                </TableCell>
                <TableCell className="font-mono">৳{Number(c.amount).toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`font-mono font-bold ${Number(c.balance) > 0 ? "text-green-700" : "text-muted-foreground"}`}>
                    ৳{Number(c.balance).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                </TableCell>
                <TableCell>
                  <Switch checked={c.isActive} onCheckedChange={v => toggleActive(c.id, v)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
