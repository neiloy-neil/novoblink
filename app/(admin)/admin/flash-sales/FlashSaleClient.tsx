"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap } from "lucide-react"

type FlashSale = {
  id: string; name: string; discountType: string; discountValue: number
  scope: string; targetName: string; startsAt: string; endsAt: string; isActive: boolean
}

function isLive(s: FlashSale) {
  const now = Date.now()
  return s.isActive && new Date(s.startsAt).getTime() <= now && new Date(s.endsAt).getTime() >= now
}

export function FlashSaleClient({
  data,
  products,
  categories,
}: {
  data: FlashSale[]
  products: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [discountType, setDiscountType] = useState("PERCENTAGE")
  const [discountValue, setDiscountValue] = useState("")
  const [scope, setScope] = useState("SITEWIDE")
  const [productId, setProductId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16))
  const [endsAt, setEndsAt] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, discountType, discountValue, scope, productId, categoryId, startsAt, endsAt }),
      })
      if (res.ok) {
        toast.success("Flash sale created")
        setOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to create")
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/admin/flash-sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) { toast.success("Updated"); router.refresh() }
    else toast.error("Failed")
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flash sale?")) return
    const res = await fetch(`/api/admin/flash-sales/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted"); router.refresh() }
    else toast.error("Failed")
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button className="gap-2"><Zap className="h-4 w-4" /> New Flash Sale</Button>} />
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Flash Sale</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Sale Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Eid Mega Sale" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Discount Type</label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v || "PERCENTAGE")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <Input required type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "PERCENTAGE" ? "e.g. 20 for 20%" : "e.g. 200"} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Applies To</label>
              <Select value={scope} onValueChange={(v) => setScope(v || "SITEWIDE")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SITEWIDE">Entire Store</SelectItem>
                  <SelectItem value="CATEGORY">Specific Category</SelectItem>
                  <SelectItem value="PRODUCT">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === "CATEGORY" && (
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v || "")}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {scope === "PRODUCT" && (
              <div>
                <label className="text-sm font-medium">Product</label>
                <Select value={productId} onValueChange={(v) => setProductId(v || "")}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Starts At</label>
                <Input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Ends At</label>
                <Input required type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Creating..." : "Create Flash Sale"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Ends</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No flash sales yet.</TableCell></TableRow>
            ) : data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="font-mono">
                  {s.discountType === "PERCENTAGE" ? `${s.discountValue}%` : `৳${s.discountValue}`} off
                </TableCell>
                <TableCell>{s.targetName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(s.endsAt).toLocaleDateString("en-BD")}
                </TableCell>
                <TableCell>
                  {isLive(s)
                    ? <Badge className="bg-green-100 text-green-800 border-green-200 gap-1"><Zap className="h-3 w-3" /> LIVE</Badge>
                    : s.isActive
                    ? <Badge variant="secondary">Scheduled</Badge>
                    : <Badge variant="outline">Inactive</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(s.id, s.isActive)}>
                    {s.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
