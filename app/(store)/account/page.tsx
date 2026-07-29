"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useSession, signOut } from "@/hooks/useSession"
import { useRouter } from "next/navigation"
import { User, Package, MapPin, Gift, LogOut, Wallet, Link2, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import AddressList from "@/components/store/account/AddressList"

const RETURN_REASONS: { value: string; label: string }[] = [
  { value: "WRONG_SIZE", label: "Wrong size" },
  { value: "DEFECTIVE", label: "Defective / damaged" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "QUALITY_ISSUE", label: "Quality issue" },
  { value: "OTHER", label: "Other" },
]

const RETURN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  RECEIVED: "bg-purple-100 text-purple-800",
  REFUNDED: "bg-green-100 text-green-800",
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [loyaltyBalance, setLoyaltyBalance] = useState(0)
  const [storeCreditBalance, setStoreCreditBalance] = useState(0)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [myReturns, setMyReturns] = useState<any[]>([])
  const [returnsLoading, setReturnsLoading] = useState(false)
  // Return request modal state
  const [returnOrder, setReturnOrder] = useState<any>(null)
  const [returnSelections, setReturnSelections] = useState<Record<string, number>>({})
  const [returnReason, setReturnReason] = useState("WRONG_SIZE")
  const [returnNote, setReturnNote] = useState("")
  const [submittingReturn, setSubmittingReturn] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/account")
    }
  }, [status, router])

  // Fetch orders
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders || []); setOrdersLoading(false) })
      .catch(() => setOrdersLoading(false))
  }, [status])

  // Fetch loyalty balance, store credit, affiliate
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/account/loyalty").then(r => r.json()).then(d => setLoyaltyBalance(d.balance || 0)).catch(() => {})
    fetch("/api/account/store-credit").then(r => r.json()).then(d => setStoreCreditBalance(d.balance || 0)).catch(() => {})
    fetch("/api/account/affiliate").then(r => r.json()).then(d => setAffiliate(d.affiliate || null)).catch(() => {})
  }, [status])

  // Fetch returns when tab is opened
  useEffect(() => {
    if (activeTab !== "returns" || status !== "authenticated") return
    setReturnsLoading(true)
    fetch("/api/account/returns")
      .then(r => r.json())
      .then(d => { setMyReturns(d.returns || []); setReturnsLoading(false) })
      .catch(() => setReturnsLoading(false))
  }, [activeTab, status])

  function openReturnModal(order: any) {
    setReturnOrder(order)
    setReturnSelections({})
    setReturnReason("WRONG_SIZE")
    setReturnNote("")
  }

  function toggleReturnItem(itemId: string, maxQty: number) {
    setReturnSelections(prev =>
      prev[itemId] ? (({ [itemId]: _, ...rest }) => rest)(prev) : { ...prev, [itemId]: maxQty }
    )
  }

  async function submitReturn() {
    if (!returnOrder) return
    const selectedItems = Object.entries(returnSelections).map(([orderItemId, quantity]) => ({ orderItemId, quantity }))
    if (!selectedItems.length) { toast.error("Select at least one item to return"); return }
    setSubmittingReturn(true)
    try {
      const res = await fetch("/api/store/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: returnOrder.id, items: selectedItems, reason: returnReason, note: returnNote || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit")
      toast.success("Return request submitted! We'll review it shortly.")
      setReturnOrder(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmittingReturn(false)
    }
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: "/" })
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value?.trim()
    if (!name) return
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        toast.success("Profile updated successfully")
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to update profile")
      }
    } catch {
      toast.error("Error updating profile")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-novo-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const firstName = user?.name?.split(" ")[0] || "there"

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-6xl animate-in fade-in duration-500">
      <div className="mb-12">
        <h1 className="text-4xl font-heading font-bold text-novo-black mb-2">My Account</h1>
        <p className="text-novo-text-muted">Welcome back, {firstName}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-12">

        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {[
            { key: "orders", label: "My Orders", icon: Package },
            { key: "returns", label: "My Returns", icon: RotateCcw },
            { key: "profile", label: "Profile Details", icon: User },
            { key: "addresses", label: "Saved Addresses", icon: MapPin },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? "bg-novo-black text-white" : "hover:bg-novo-muted text-novo-text-muted hover:text-novo-black"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "loyalty" ? "bg-novo-black text-white" : "hover:bg-novo-muted text-novo-text-muted hover:text-novo-black"
            }`}
          >
            <div className="flex items-center gap-3"><Gift className="w-4 h-4" /> NovoBlink Club</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === "loyalty" ? "bg-white text-novo-black" : "bg-novo-blue text-white"}`}>
              {loyaltyBalance} pt
            </span>
          </button>
          {storeCreditBalance > 0 && (
            <button
              onClick={() => setActiveTab("credit")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "credit" ? "bg-novo-black text-white" : "hover:bg-novo-muted text-novo-text-muted hover:text-novo-black"
              }`}
            >
              <div className="flex items-center gap-3"><Wallet className="w-4 h-4" /> Store Credit</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === "credit" ? "bg-white text-novo-black" : "bg-green-100 text-green-800"}`}>
                ৳{storeCreditBalance}
              </span>
            </button>
          )}
          {affiliate && (
            <button
              onClick={() => setActiveTab("affiliate")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "affiliate" ? "bg-novo-black text-white" : "hover:bg-novo-muted text-novo-text-muted hover:text-novo-black"
              }`}
            >
              <Link2 className="w-4 h-4" /> Referral
            </button>
          )}
          <div className="pt-8 mt-8 border-t border-novo-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-novo-error hover:bg-novo-error/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold mb-6">Order History</h2>
              {ordersLoading ? (
                <div className="text-novo-text-muted text-sm">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <Package className="w-12 h-12 mx-auto text-novo-border" />
                  <p className="text-novo-text-muted">No orders yet. Time to shop!</p>
                  <button
                    onClick={() => router.push("/shop")}
                    className="mt-2 px-6 py-3 bg-novo-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors text-xs"
                  >
                    Browse Shop
                  </button>
                </div>
              ) : (
                orders.map((order: any) => (
                  <div key={order.id} className="border border-novo-border rounded-2xl overflow-hidden bg-white">
                    <div className="bg-novo-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-novo-border text-sm">
                      <div>
                        <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Order Placed</p>
                        <p className="font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Total</p>
                        <p className="font-medium mt-0.5">৳{Number(order.total).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Status</p>
                        <p className="font-medium text-novo-blue mt-0.5">{order.status}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Order #</p>
                        <p className="font-mono mt-0.5">{order.orderNumber}</p>
                      </div>
                      {order.status === "DELIVERED" && (
                        <button
                          onClick={() => openReturnModal(order)}
                          className="text-xs text-novo-text-muted underline underline-offset-2 hover:text-novo-black transition-colors"
                        >
                          Request Return
                        </button>
                      )}
                    </div>
                    {order.items?.slice(0, 1).map((item: any) => (
                      <div key={item.id} className="p-6 flex gap-4">
                        <div className="relative w-20 h-24 bg-novo-muted rounded-md shrink-0 overflow-hidden">
                          {item.product?.images?.[0]?.url && (
                            <Image src={item.product.images[0].url} alt={item.productName} fill sizes="80px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-novo-black">{item.productName}</h4>
                          <p className="text-sm text-novo-text-muted mt-1">Size: {item.size} | Color: {item.color}</p>
                          <p className="text-sm font-mono mt-1">৳{Number(item.price).toLocaleString()} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold mb-6">Profile Details</h2>
              <form className="max-w-md space-y-4" onSubmit={handleSaveProfile}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Full Name</label>
                  <input name="name" defaultValue={user?.name || ""} className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Email Address</label>
                  <input defaultValue={user?.email || ""} disabled className="w-full bg-novo-muted border border-transparent rounded-lg px-4 py-3 text-sm outline-none opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-novo-text-muted">Email cannot be changed.</p>
                </div>
                <div className="pt-4">
                  <button type="submit" className="px-6 py-3 bg-novo-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors text-xs">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "addresses" && (
            <AddressList />
          )}

          {activeTab === "credit" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Store Credit</h2>
              <div className="bg-novo-black text-white rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-2">Available Balance</p>
                  <h3 className="text-5xl font-mono font-bold text-green-400 mb-2">৳{storeCreditBalance.toLocaleString()}</h3>
                  <p className="text-sm text-gray-300">Automatically applied at checkout when you place your next order.</p>
                </div>
              </div>
              <p className="text-sm text-novo-text-muted">Store credit never expires and can be used toward any purchase. You'll see the option to apply it in step 3 of checkout.</p>
            </div>
          )}

          {activeTab === "affiliate" && affiliate && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Your Referral Dashboard</h2>
              <div className="bg-white border border-novo-border rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted mb-2">Your Referral Link</p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}?ref=${affiliate.code}`}
                      className="flex-1 bg-novo-muted rounded-lg px-4 py-2 text-sm font-mono"
                    />
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}?ref=${affiliate.code}`); }}
                      className="px-4 py-2 bg-novo-black text-white rounded-lg text-xs font-bold hover:bg-novo-blue transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-novo-border">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Clicks</p>
                    <p className="text-2xl font-mono font-bold mt-1">{affiliate.totalClicks || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Orders</p>
                    <p className="text-2xl font-mono font-bold mt-1">{affiliate._count?.conversions || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Earned</p>
                    <p className="text-2xl font-mono font-bold mt-1 text-novo-blue">৳{Number(affiliate.totalEarned || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-novo-border">
                  <p className="text-xs text-novo-text-muted">
                    Commission: {affiliate.commissionType === "PERCENTAGE" ? `${affiliate.commissionValue}%` : `৳${affiliate.commissionValue}`} per referred order.
                    Payouts are processed weekly to your registered bKash number.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "returns" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">My Returns</h2>
              {returnsLoading ? (
                <div className="text-novo-text-muted text-sm">Loading...</div>
              ) : myReturns.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-novo-muted/30 rounded-2xl border border-novo-border">
                  <RotateCcw className="w-10 h-10 mx-auto text-novo-border" />
                  <p className="text-novo-text-muted text-sm">No return requests yet.</p>
                  <p className="text-xs text-novo-text-muted">You can request a return from a delivered order in the Orders tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReturns.map((r: any) => (
                    <div key={r.id} className="border border-novo-border rounded-2xl overflow-hidden bg-white">
                      <div className="bg-novo-muted/30 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-novo-border text-sm">
                        <div>
                          <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Order #</p>
                          <p className="font-mono mt-0.5">{r.order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Reason</p>
                          <p className="mt-0.5">{RETURN_REASONS.find(x => x.value === r.reason)?.label ?? r.reason}</p>
                        </div>
                        <div>
                          <p className="text-xs text-novo-text-muted uppercase tracking-widest font-bold">Submitted</p>
                          <p className="mt-0.5">{new Date(r.createdAt).toLocaleDateString("en-BD")}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${RETURN_STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="px-6 py-4 space-y-2">
                        {r.items.map((i: any) => (
                          <div key={i.id} className="flex justify-between text-sm">
                            <span>{i.orderItem.productName} — {i.orderItem.size} / {i.orderItem.color}</span>
                            <span className="text-novo-text-muted">×{i.quantity}</span>
                          </div>
                        ))}
                        {r.adminNote && (
                          <p className="text-xs text-novo-text-muted mt-2 pt-2 border-t border-novo-border">
                            <span className="font-bold">Store note:</span> {r.adminNote}
                          </p>
                        )}
                        {r.status === "REFUNDED" && r.refundAmount && (
                          <p className="text-sm font-bold text-green-700 mt-2">
                            ৳{Number(r.refundAmount).toLocaleString()} store credit issued to your account.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-heading font-bold">NovoBlink Club Rewards</h2>
              <div className="bg-novo-black text-white rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-novo-blue/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-novo-text-muted uppercase tracking-widest text-xs font-bold mb-2">Available Points</p>
                  <h3 className="text-5xl font-mono font-bold text-novo-blue mb-6">{loyaltyBalance}</h3>
                  <p className="text-sm text-gray-300 max-w-sm">
                    {loyaltyBalance > 0
                      ? <>You have enough points to get <span className="text-white font-bold">৳{(loyaltyBalance * 0.1).toFixed(0)} off</span> your next purchase.</>
                      : "Start shopping to earn NovoBlink Club points!"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-4">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { step: "1", title: "Shop", desc: "Earn 1 point for every ৳10 spent on our store." },
                    { step: "2", title: "Collect", desc: "Points are automatically added after delivery." },
                    { step: "3", title: "Redeem", desc: "Apply points at checkout for instant discounts." },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="p-6 border border-novo-border rounded-2xl bg-white">
                      <div className="w-10 h-10 bg-novo-blue/10 text-novo-blue rounded-full flex items-center justify-center mb-4 font-bold">{step}</div>
                      <h4 className="font-bold text-sm mb-2">{title}</h4>
                      <p className="text-xs text-novo-text-muted">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Request Modal */}
      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setReturnOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-novo-border">
              <h3 className="font-heading font-bold text-lg">Request Return — {returnOrder.orderNumber}</h3>
              <button onClick={() => setReturnOrder(null)} className="text-novo-text-muted hover:text-novo-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted mb-3">Select items to return</p>
                <div className="space-y-2">
                  {returnOrder.items?.map((item: any) => (
                    <label key={item.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${returnSelections[item.id] ? "border-novo-black bg-novo-muted/40" : "border-novo-border hover:border-novo-black/40"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!returnSelections[item.id]}
                          onChange={() => toggleReturnItem(item.id, item.quantity)}
                          className="accent-novo-black w-4 h-4"
                        />
                        <div>
                          <p className="text-sm font-medium">{item.productName}</p>
                          <p className="text-xs text-novo-text-muted">{item.size} / {item.color}</p>
                        </div>
                      </div>
                      <span className="text-xs text-novo-text-muted">×{item.quantity}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted block mb-2">Reason</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"
                >
                  {RETURN_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted block mb-2">Additional note (optional)</label>
                <textarea
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none"
                />
              </div>
              <button
                onClick={submitReturn}
                disabled={submittingReturn || Object.keys(returnSelections).length === 0}
                className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReturn ? "Submitting..." : "Submit Return Request"}
              </button>
              <p className="text-xs text-novo-text-muted text-center">
                We'll review your request and respond within 2–3 business days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
