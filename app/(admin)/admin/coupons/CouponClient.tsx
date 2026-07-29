"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type Coupon = {
  id: string
  code: string
  type: string
  value: number
  minOrderAmount: number | null
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export function CouponClient({ data }: { data: Coupon[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [type, setType] = useState("PERCENTAGE")
  const [value, setValue] = useState("")
  const [minOrder, setMinOrder] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [bogoEnabled, setBogoEnabled] = useState(false)
  const [buyQty, setBuyQty] = useState("2")
  const [getQty, setGetQty] = useState("1")

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id)
    setCode(coupon.code)
    setType(coupon.type)
    setValue(String(coupon.value))
    setMinOrder(coupon.minOrderAmount ? String(coupon.minOrderAmount) : "")
    setMaxUses(coupon.maxUses ? String(coupon.maxUses) : "")
    setExpiresAt(coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "")
    setBogoEnabled(false)
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setCode(""); setValue(""); setMinOrder(""); setMaxUses(""); setExpiresAt("")
    setBogoEnabled(false); setBuyQty("2"); setGetQty("1"); setType("PERCENTAGE")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let couponData: any
      if (editingId) {
        const res = await fetch(`/api/admin/coupons/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: parseFloat(value),
            minOrderAmount: minOrder || null,
            maxUses: maxUses || null,
            expiresAt: expiresAt || null,
          }),
        })
        couponData = await res.json()
        if (!res.ok) { toast.error(couponData.error || "Failed to update coupon"); return }
        toast.success("Coupon updated")
      } else {
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            type: bogoEnabled ? "FLAT" : type,
            value: bogoEnabled ? 0 : parseFloat(value),
            minOrderAmount: minOrder ? parseFloat(minOrder) : null,
            maxUses: maxUses ? parseInt(maxUses) : null,
            expiresAt: expiresAt || null,
          }),
        })
        couponData = await res.json()
        if (!res.ok) { toast.error(couponData.error || "Failed to create coupon"); return }
        if (bogoEnabled && couponData.coupon?.id) {
          await fetch("/api/admin/coupon-rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ couponId: couponData.coupon.id, ruleType: "BOGO", buyQty: parseInt(buyQty), getQty: parseInt(getQty) }),
          })
        }
        toast.success("Coupon created")
      }
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("Error saving coupon")
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        toast.success(`Coupon ${currentStatus ? "disabled" : "enabled"}`)
        router.refresh()
      } else {
        toast.error("Failed to update coupon")
      }
    } catch {
      toast.error("Error updating coupon")
    }
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Coupon deleted")
        router.refresh()
      } else {
        toast.error("Failed to delete coupon")
      }
    } catch {
      toast.error("Error deleting coupon")
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
        <DialogTrigger render={<Button>Create Coupon</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Coupon" : "Create New Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Code</label>
              <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER50" disabled={!!editingId} className={editingId ? "opacity-60" : ""} />
            </div>
            {!editingId && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <input type="checkbox" id="bogo" checked={bogoEnabled} onChange={e => setBogoEnabled(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="bogo" className="text-sm font-medium text-neutral-700 cursor-pointer">BOGO — Buy X Get Y Free</label>
              </div>
            )}
            {!editingId && bogoEnabled ? (
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border">
                <div>
                  <label className="text-xs font-medium text-neutral-600">Buy Qty (X)</label>
                  <Input type="number" min="1" value={buyQty} onChange={e => setBuyQty(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600">Get Qty Free (Y)</label>
                  <Input type="number" min="1" value={getQty} onChange={e => setGetQty(e.target.value)} />
                </div>
                <p className="col-span-2 text-xs text-neutral-500">Cheapest item(s) in cart become free per qualifying group.</p>
              </div>
            ) : (
              <>
                {!editingId && (
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Type</label>
                    <Select value={type} onValueChange={(val) => setType(val || "PERCENTAGE")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-700">Value</label>
                  <Input required type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-medium text-neutral-700">Min Order Amount (Optional)</label>
              <Input type="number" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Max Uses (Optional)</label>
              <Input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Expires At (Optional)</label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Save Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">No coupons found.</TableCell>
              </TableRow>
            ) : (
              data.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-bold font-mono">{coupon.code}</TableCell>
                  <TableCell>{coupon.type}</TableCell>
                  <TableCell>{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : `৳${coupon.value}`}</TableCell>
                  <TableCell>{coupon.minOrderAmount ? `৳${coupon.minOrderAmount}` : "—"}</TableCell>
                  <TableCell>{coupon.usedCount} / {coupon.maxUses || "∞"}</TableCell>
                  <TableCell>{coupon.expiresAt ? format(new Date(coupon.expiresAt), "MMM d, yyyy") : "Never"}</TableCell>
                  <TableCell>
                    <Badge variant={coupon.isActive ? "default" : "secondary"}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(coupon.id, coupon.isActive)}>
                      {coupon.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(coupon.id, coupon.code)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
