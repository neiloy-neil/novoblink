"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "secondary", APPROVED: "default", REJECTED: "destructive", REFUNDED: "default", RECEIVED: "outline"
}

type ReturnReq = {
  id: string; orderId: string; reason: string; status: string; note: string | null
  adminNote: string | null; refundAmount: number | null; createdAt: string
  order: { orderNumber: string; shippingName: string; shippingPhone: string }
  items: { id: string; quantity: number; orderItem: { productName: string; size: string; color: string } }[]
}

export default function ReturnsClient({ data }: { data: ReturnReq[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<ReturnReq | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("ALL")

  function openDetail(r: ReturnReq) {
    setSelected(r); setNewStatus(r.status); setAdminNote(r.adminNote || ""); setRefundAmount(r.refundAmount?.toString() || "")
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/returns/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote, refundAmount: refundAmount ? Number(refundAmount) : null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Return updated")
      setSelected(null)
      router.refresh()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const filtered = filter === "ALL" ? data : data.filter(r => r.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "REFUNDED", "RECEIVED"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Return #{selected?.order.orderNumber}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Customer:</span> {selected.order.shippingName} ({selected.order.shippingPhone})</p>
                <p><span className="font-medium">Reason:</span> {selected.reason.replace("_", " ")}</p>
                {selected.note && <p><span className="font-medium">Note:</span> {selected.note}</p>}
              </div>
              <div className="rounded border divide-y text-sm">
                {selected.items.map(i => (
                  <div key={i.id} className="px-3 py-2 flex justify-between">
                    <span>{i.orderItem.productName} ({i.orderItem.size}/{i.orderItem.color})</span>
                    <span className="text-muted-foreground">×{i.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newStatus} onValueChange={v => { if (v) setNewStatus(v) }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["PENDING","APPROVED","REJECTED","RECEIVED","REFUNDED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Refund Amount (৳)</label>
                  <Input type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Note</label>
                  <Input value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note..." />
                </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Update Return"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No returns found</TableCell></TableRow>}
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.order.orderNumber}</TableCell>
                <TableCell>{r.order.shippingName}</TableCell>
                <TableCell className="text-sm">{r.reason.replace(/_/g, " ")}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.items.length} item(s)</TableCell>
                <TableCell><Badge variant={STATUS_COLORS[r.status] as any}>{r.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => openDetail(r)}>Review</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
