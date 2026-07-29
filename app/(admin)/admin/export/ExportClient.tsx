"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, FileText, Users, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

const EXPORT_TYPES = [
  { value: "orders", label: "Orders", icon: FileText, description: "Order number, status, customer, items, totals, shipping address" },
  { value: "customers", label: "Customers", icon: Users, description: "Name, email, join date, total orders, lifetime value, last order date" },
  { value: "products", label: "Products", icon: ShoppingBag, description: "Product name, SKU, category, brand, stock, price, total units sold" },
]

export default function ExportClient() {
  const [type, setType] = useState("orders")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const params = new URLSearchParams({ type })
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    try {
      const res = await fetch(`/api/admin/export?${params}`)
      if (!res.ok) { toast.error("Export failed"); setLoading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type}-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Downloaded!")
    } catch {
      toast.error("Export failed")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {EXPORT_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`border rounded-xl p-4 text-left transition-all ${type === t.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-gray-300"}`}
          >
            <t.icon className={`w-6 h-6 mb-2 ${type === t.value ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-semibold text-sm">{t.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="border rounded-xl p-5 bg-white space-y-4">
        <h3 className="font-medium text-sm">Date range (optional)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">From</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">To</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>

        <Button className="w-full" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          {loading ? "Preparing export..." : `Export ${EXPORT_TYPES.find(t => t.value === type)?.label} as CSV`}
        </Button>
      </div>
    </div>
  )
}
