"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Printer, AlertTriangle, Download } from "lucide-react"
import Link from "next/link"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  PACKED: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
}

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
}

type Order = {
  id: string
  orderNumber: string
  shippingName: string
  createdAt: string
  total: number
  paymentMethod: string
  paymentStatus: string
  status: string
  user?: { name: string } | null
}

type RiskInfo = { riskLevel: string; successRate: number }

export default function OrdersBulkClient({
  orders,
  riskByPhone,
}: {
  orders: Order[]
  riskByPhone: Record<string, RiskInfo>
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState("")
  const [loading, setLoading] = useState(false)

  const allSelected = orders.length > 0 && selected.size === orders.length
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(orders.map((o) => o.id)))
  }

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  async function applyBulk() {
    if (!bulkStatus || selected.size === 0) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action: "UPDATE_STATUS", status: bulkStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`${data.updated} order${data.updated !== 1 ? "s" : ""} updated to ${bulkStatus}`)
      setSelected(new Set())
      setBulkStatus("")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to update orders")
    } finally {
      setLoading(false)
    }
  }

  function printSelected() {
    for (const id of Array.from(selected)) {
      window.open(`/admin/orders/${id}/packing-slip`, "_blank")
    }
  }

  return (
    <>
      {/* Bulk action bar */}
      <div className={`px-4 py-3 border-b flex items-center gap-3 transition-all duration-200 ${someSelected ? "bg-primary/5" : "bg-transparent"}`}>
        <span className={`text-sm font-medium min-w-[100px] ${someSelected ? "text-primary" : "text-muted-foreground"}`}>
          {someSelected ? `${selected.size} selected` : "No selection"}
        </span>
        {someSelected && (
          <>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">Change status…</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button size="sm" onClick={applyBulk} disabled={!bulkStatus || loading}>
              {loading ? "Updating…" : "Apply"}
            </Button>
            <Button size="sm" variant="outline" onClick={printSelected} className="gap-1">
              <Printer className="h-3.5 w-3.5" /> Print Packing Slips
            </Button>
            <a href={`/api/admin/orders/export?ids=${Array.from(selected).join(",")}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </a>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-input"
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Order No</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => {
            const risk = riskByPhone[(order as any).shippingPhone]
            const isSelected = selected.has(order.id)
            return (
              <TableRow key={order.id} className={isSelected ? "bg-primary/5" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(order.id)}
                    className="rounded border-input"
                  />
                </TableCell>
                <TableCell className="font-medium font-mono text-xs">{order.orderNumber}</TableCell>
                <TableCell>{order.user?.name || order.shippingName}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString("en-BD")}</TableCell>
                <TableCell className="font-mono">৳{Number(order.total).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-medium">{order.paymentMethod}</span>
                    <Badge variant="outline" className="w-fit text-[10px]">{order.paymentStatus}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {risk && risk.riskLevel !== "NEW" ? (
                    <Badge variant="outline" className={`gap-1 text-[10px] ${RISK_COLORS[risk.riskLevel]}`}>
                      {risk.riskLevel === "HIGH" && <AlertTriangle className="h-3 w-3" />}
                      {risk.riskLevel} · {Math.round((risk.successRate ?? 0) * 100)}%
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">New</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
