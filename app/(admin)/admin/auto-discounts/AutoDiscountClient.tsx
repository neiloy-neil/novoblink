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
import { Percent } from "lucide-react"

const RULE_LABELS: Record<string, string> = {
  BUY_X_GET_PERCENT: "Buy X of same product",
  SPEND_X_GET_PERCENT: "Spend X in cart",
  BUY_X_ITEMS_GET_PERCENT: "Buy X items total",
}

type AutoDiscount = {
  id: string; name: string; ruleType: string
  thresholdQty: number | null; thresholdAmt: number | null
  discountPct: number; isActive: boolean; endsAt: string | null
}

export function AutoDiscountClient({ data }: { data: AutoDiscount[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [ruleType, setRuleType] = useState("SPEND_X_GET_PERCENT")
  const [thresholdQty, setThresholdQty] = useState("")
  const [thresholdAmt, setThresholdAmt] = useState("")
  const [discountPct, setDiscountPct] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [saving, setSaving] = useState(false)

  function ruleHint() {
    if (ruleType === "BUY_X_GET_PERCENT") return "Min quantity of the same product"
    if (ruleType === "SPEND_X_GET_PERCENT") return "Min cart subtotal (৳)"
    return "Min total items in cart"
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/auto-discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, ruleType,
          thresholdQty: ruleType !== "SPEND_X_GET_PERCENT" ? thresholdQty : null,
          thresholdAmt: ruleType === "SPEND_X_GET_PERCENT" ? thresholdAmt : null,
          discountPct, endsAt: endsAt || null,
        }),
      })
      if (res.ok) { toast.success("Discount created"); setOpen(false); router.refresh() }
      else { const d = await res.json(); toast.error(d.error) }
    } finally { setSaving(false) }
  }

  async function toggle(id: string, current: boolean) {
    const res = await fetch(`/api/admin/auto-discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) { toast.success("Updated"); router.refresh() }
  }

  async function del(id: string) {
    if (!confirm("Delete this discount rule?")) return
    const res = await fetch(`/api/admin/auto-discounts/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Deleted"); router.refresh() }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button className="gap-2"><Percent className="h-4 w-4" /> New Auto Discount</Button>} />
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Auto Discount</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Rule Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Buy 2 Get 10% Off" />
            </div>
            <div>
              <label className="text-sm font-medium">Rule Type</label>
              <Select value={ruleType} onValueChange={(v) => setRuleType(v || "SPEND_X_GET_PERCENT")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RULE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{ruleHint()}</label>
              {ruleType === "SPEND_X_GET_PERCENT"
                ? <Input required type="number" min="1" value={thresholdAmt} onChange={(e) => setThresholdAmt(e.target.value)} placeholder="e.g. 2000" />
                : <Input required type="number" min="1" value={thresholdQty} onChange={(e) => setThresholdQty(e.target.value)} placeholder="e.g. 2" />}
            </div>
            <div>
              <label className="text-sm font-medium">Discount (%)</label>
              <Input required type="number" min="1" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div>
              <label className="text-sm font-medium">Expires At (optional)</label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? "Creating..." : "Create Rule"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center">No auto discount rules yet.</TableCell></TableRow>
            ) : data.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{RULE_LABELS[d.ruleType] || d.ruleType}</TableCell>
                <TableCell className="font-mono text-sm">
                  {d.ruleType === "SPEND_X_GET_PERCENT" ? `৳${d.thresholdAmt?.toLocaleString()}` : `${d.thresholdQty} items`}
                </TableCell>
                <TableCell className="font-mono font-bold text-green-700">{d.discountPct}% off</TableCell>
                <TableCell>
                  <Badge variant={d.isActive ? "default" : "secondary"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggle(d.id, d.isActive)}>
                    {d.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => del(d.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
