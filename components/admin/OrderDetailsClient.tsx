"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Printer, AlertTriangle, ShieldCheck, Tag, X, Send, MessageSquare, Phone, PhoneCall } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { CustomerRisk } from "@/lib/customerRisk"

const RISK_BADGE_CLASS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
}

export default function OrderDetailsClient({
  initialOrder,
  customerRisk,
}: {
  initialOrder: any
  customerRisk?: CustomerRisk | null
}) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>(initialOrder.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [msgText, setMsgText] = useState("")
  const [msgLoading, setMsgLoading] = useState(false)
  const codVerified = tags.includes("cod-verified")
  const [codNote, setCodNote] = useState<string>(initialOrder.codCallNote || "")
  const [codNoteSaving, setCodNoteSaving] = useState(false)

  const saveCodNote = async () => {
    setCodNoteSaving(true)
    try {
      await fetch(`/api/admin/orders/${order.id}/cod-note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codCallNote: codNote }),
      })
      toast.success("Call note saved")
    } catch { toast.error("Failed to save") }
    finally { setCodNoteSaving(false) }
  }
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [deliveryData, setDeliveryData] = useState({
    courier: order.delivery?.courier || "PATHAO",
    consignmentId: order.delivery?.consignmentId || "",
    trackingCode: order.delivery?.trackingCode || "",
  })

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, status: updated.status })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, paymentStatus: updated.paymentStatus })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch(`/api/admin/orders/${initialOrder.id}/messages`)
      .then(r => r.json()).then(d => setMessages(d.messages || [])).catch(() => {})
  }, [initialOrder.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addTag = async () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-")
    if (!t || tags.includes(t)) { setTagInput(""); return }
    const next = [...tags, t]
    setTags(next)
    setTagInput("")
    await fetch(`/api/admin/orders/${order.id}/tags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    })
  }

  const removeTag = async (t: string) => {
    const next = tags.filter(x => x !== t)
    setTags(next)
    await fetch(`/api/admin/orders/${order.id}/tags`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: next }),
    })
  }

  const sendMessage = async () => {
    if (!msgText.trim()) return
    setMsgLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText }),
      })
      if (res.ok) {
        const d = await res.json()
        setMessages(prev => [...prev, d.message])
        setMsgText("")
      }
    } finally {
      setMsgLoading(false) }
  }

  const saveDelivery = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryData)
      })
      if (res.ok) {
        toast.success("Delivery information saved")
        router.refresh()
      } else {
        toast.error("Failed to save delivery info")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <a href={`/order/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Printer className="h-3.5 w-3.5" /> Invoice
          </Button>
        </a>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-auto">

        {/* Order Items — spans 8 cols, tall */}
        <Card className="col-span-12 md:col-span-8 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2.5 border-b last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.size} · {item.color}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-muted-foreground">৳{item.price} × {item.quantity}</p>
                    <p className="font-semibold text-sm">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>৳{order.subtotal.toString()}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>৳{order.shippingCharge.toString()}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-৳{order.discount.toString()}</span></div>}
              <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span>৳{order.total.toString()}</span></div>
              {Number(order.depositAmount) > 0 && (
                <div className={`flex justify-between text-xs pt-1 ${order.depositPaid ? "text-green-700" : "text-orange-600"}`}>
                  <span>{order.depositPaid ? "Advance paid (bKash)" : "Advance pending"}</span>
                  <span>৳{order.depositAmount.toString()}</span>
                </div>
              )}
              {order.depositPaid && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Due on delivery</span>
                  <span>৳{(Number(order.total) - Number(order.depositAmount)).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer — spans 4 cols */}
        <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingPhone}</p>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed bg-slate-50 rounded-lg p-3">
              <p>{order.shippingAddress}</p>
              <p>{order.shippingArea}, {order.shippingDistrict}</p>
              <p>{order.shippingDivision}</p>
            </div>
            {order.note && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                <strong>Note: </strong>{order.note}
              </div>
            )}
            {customerRisk && customerRisk.riskLevel !== "NEW" && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${RISK_BADGE_CLASS[customerRisk.riskLevel]}`}>
                <div className="flex items-center gap-2 font-bold">
                  {customerRisk.riskLevel === "HIGH" ? <AlertTriangle className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {customerRisk.riskLevel} risk
                </div>
                <p>{customerRisk.delivered} delivered / {customerRisk.returnedOrCancelled} returned · {Math.round((customerRisk.successRate ?? 0) * 100)}% success</p>
                {customerRisk.riskLevel === "HIGH" && <p className="font-medium">Consider requiring advance payment.</p>}
              </div>
            )}
            {customerRisk?.riskLevel === "NEW" && customerRisk.totalOrders <= 1 && (
              <div className="p-3 rounded-lg border bg-muted text-xs text-muted-foreground">First order — no history yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Status Management — 4 cols */}
        <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Order Status</label>
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={loading}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
            <div className="space-y-1.5 pt-3 border-t">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment</label>
              <div className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg text-sm">
                <span className="font-medium">{order.paymentMethod}</span>
                <Badge variant="outline" className="text-xs">{order.paymentStatus}</Badge>
              </div>
              <select
                value={order.paymentStatus}
                onChange={(e) => updatePaymentStatus(e.target.value)}
                disabled={loading}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial (deposit only)</option>
                <option value="PAID">Paid</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Info — 4 cols */}
        <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Courier</label>
              <select
                value={deliveryData.courier}
                onChange={e => setDeliveryData({...deliveryData, courier: e.target.value})}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="PATHAO">Pathao</option>
                <option value="STEADFAST">Steadfast</option>
                <option value="SELF">Self Delivery</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consignment ID</label>
              <input
                type="text"
                value={deliveryData.consignmentId}
                onChange={e => setDeliveryData({...deliveryData, consignmentId: e.target.value})}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tracking Code</label>
              <input
                type="text"
                value={deliveryData.trackingCode}
                onChange={e => setDeliveryData({...deliveryData, trackingCode: e.target.value})}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button onClick={saveDelivery} disabled={loading} size="sm" className="w-full mt-1">
              {loading ? "Saving…" : "Save Delivery Info"}
            </Button>
          </CardContent>
        </Card>

        {/* COD Verification — 4 cols (only if COD) */}
        {order.paymentMethod === "COD" && (
          <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />COD Verification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => codVerified ? removeTag("cod-verified") : (setTags(t => [...t, "cod-verified"]), fetch(`/api/admin/orders/${order.id}/tags`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags: [...tags, "cod-verified"] }) }))}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${codVerified ? "border-green-500 bg-green-50 text-green-700" : "border-dashed border-slate-300 text-slate-500 hover:border-slate-400"}`}
              >
                <PhoneCall className="h-4 w-4" />
                {codVerified ? "✓ Verified by call" : "Mark as phone-verified"}
              </button>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Call log</label>
                <textarea
                  rows={3}
                  value={codNote}
                  onChange={e => setCodNote(e.target.value)}
                  placeholder="e.g. Customer confirmed, deliver after 6pm…"
                  className="w-full text-xs rounded-lg border border-input bg-transparent px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={saveCodNote} disabled={codNoteSaving}>
                  {codNoteSaving ? "Saving…" : "Save note"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tags — 4 cols */}
        <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" />Tags</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-red-500 ml-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTag()}
                placeholder="vip, gift, express…"
                className="flex-1 h-8 rounded-lg border border-input bg-transparent px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="sm" variant="outline" onClick={addTag} className="h-8 text-xs px-3">Add</Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages — 4 cols */}
        <Card className="col-span-12 md:col-span-4 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Messages</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
              {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No messages yet</p>}
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${m.fromAdmin ? "bg-slate-800 text-white" : "bg-muted text-foreground"}`}>
                    <p>{m.message}</p>
                    <p className={`text-[10px] mt-0.5 ${m.fromAdmin ? "text-slate-400" : "text-muted-foreground"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 pt-1 border-t">
              <input
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Reply to customer…"
                className="flex-1 h-8 rounded-lg border border-input bg-transparent px-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="sm" onClick={sendMessage} disabled={msgLoading} className="h-8 px-3">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline — full width */}
        <Card className="col-span-12 rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {order.statusLogs.map((log: any, i: number) => (
                <div key={log.id} className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3 min-w-[200px]">
                  <div className="mt-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{log.status}</p>
                    <time className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </time>
                    {log.note && <p className="text-xs text-slate-500 mt-0.5">{log.note}</p>}
                  </div>
                </div>
              ))}
              {order.statusLogs.length === 0 && <p className="text-xs text-slate-400">No status history yet.</p>}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
