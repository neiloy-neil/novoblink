"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Copy, Trash2 } from "lucide-react"

type Affiliate = { id: string; name: string; email: string; code: string; commissionType: string; commissionValue: number; totalEarned: number; totalPaid: number; isActive: boolean; createdAt: string; _count: { clicks: number; conversions: number } }

const emptyForm = { name: "", email: "", code: "", commissionType: "PERCENTAGE", commissionValue: "10", isActive: true }

export default function AffiliatesClient({ data }: { data: Affiliate[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/affiliates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Affiliate created")
      setOpen(false)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete affiliate?")) return
    await fetch(`/api/admin/affiliates/${id}`, { method: "DELETE" })
    toast.success("Deleted")
    router.refresh()
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}?ref=${code}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied!")
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : ""

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Affiliate</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Affiliate</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div><label className="text-sm font-medium">Full Name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">Email</label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div>
              <label className="text-sm font-medium">Referral Code (unique)</label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="JOHNDOE20" required />
              <p className="text-xs text-muted-foreground mt-1">Share link: ...?ref={form.code || "CODE"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Commission Type</label>
                <Select value={form.commissionType} onValueChange={v => setForm({ ...form, commissionType: v ?? form.commissionType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Commission Value</label>
                <Input type="number" value={form.commissionValue} onChange={e => setForm({ ...form, commissionValue: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Creating..." : "Create Affiliate"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Conversions</TableHead>
              <TableHead>Earned</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No affiliates yet</TableCell></TableRow>}
            {data.map(a => (
              <TableRow key={a.id}>
                <TableCell><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.email}</div></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <code className="bg-muted px-2 py-0.5 rounded text-sm font-bold">{a.code}</code>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyLink(a.code)}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{a.commissionType === "PERCENTAGE" ? `${a.commissionValue}%` : `৳${a.commissionValue}`}</TableCell>
                <TableCell className="text-sm">{a._count.clicks}</TableCell>
                <TableCell className="text-sm">{a._count.conversions}</TableCell>
                <TableCell className="font-mono text-sm">৳{Number(a.totalEarned).toLocaleString()}</TableCell>
                <TableCell><Badge variant={a.isActive ? "default" : "secondary"}>{a.isActive ? "Active" : "Paused"}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
