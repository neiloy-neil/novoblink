"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useCartStore } from "@/store/useCartStore"
import { useRouter } from "next/navigation"
import { MapPin, CreditCard, ClipboardCheck, ChevronRight, Check, Gift, MessageSquare, User, Star, Wallet, Tag, Calendar, Users } from "lucide-react"
import { trackInitiateCheckout, trackAddPaymentInfo } from "@/lib/analytics"
import { BD_GEO } from "@/lib/bd-geo"

type CheckoutField = {
  id: string
  label: string
  placeholder: string | null
  type: string
  options: string[]
  isRequired: boolean
  step: number
  sortOrder: number
}

type ShippingZone = { districts: string; charge: number; freeShippingAbove: number | null }

function resolveZoneRate(district: string, zones: ShippingZone[], fallback: number): { rate: number; freeAbove: number | null } {
  if (!district) return { rate: fallback, freeAbove: null }
  const matched = zones.find(z =>
    z.districts.split(",").map(d => d.trim().toLowerCase()).includes(district.trim().toLowerCase())
  )
  if (matched) return { rate: matched.charge, freeAbove: matched.freeShippingAbove }
  return { rate: fallback, freeAbove: null }
}

export default function CheckoutForm({
  freeShippingThreshold = 1000,
  shippingChargeAmount = 60,
  shippingZones = [],
  enabledPaymentMethods = ["COD", "BKASH", "NAGAD"],
  taxEnabled = false,
  taxRate = 0,
  taxLabel = "VAT",
  giftWrapEnabled = false,
  giftWrapCharge = 50,
  checkoutFields = [],
  loyaltyBalance = 0,
  loyaltyMaxDiscount = 0,
  storeCreditBalance = 0,
  userId,
}: {
  freeShippingThreshold?: number
  shippingChargeAmount?: number
  shippingZones?: ShippingZone[]
  enabledPaymentMethods?: string[]
  taxEnabled?: boolean
  taxRate?: number
  taxLabel?: string
  giftWrapEnabled?: boolean
  giftWrapCharge?: number
  checkoutFields?: CheckoutField[]
  loyaltyBalance?: number
  loyaltyMaxDiscount?: number
  storeCreditBalance?: number
  userId?: string
}) {
  const { items, clearCart } = useCartStore()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1 — address
  const [address, setAddress] = useState({ name: "", phone: "", division: "", district: "", area: "", fullAddress: "" })
  const [guestEmail, setGuestEmail] = useState("")
  const [isGuest, setIsGuest] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [expressReady, setExpressReady] = useState(false)

  // Step 2 — payment
  const [paymentMethod, setPaymentMethod] = useState(
    enabledPaymentMethods.includes("COD") ? "COD" : enabledPaymentMethods[0] || "COD"
  )
  const [depositInfo, setDepositInfo] = useState<{ required: boolean; amount: number } | null>(null)

  // Step 3 — extras
  const [orderNote, setOrderNote] = useState("")
  const [giftWrap, setGiftWrap] = useState(false)
  const [giftMessage, setGiftMessage] = useState("")

  // Loyalty points redemption
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [pointsToRedeem, setPointsToRedeem] = useState(0)

  // Store credit redemption
  const [redeemCredit, setRedeemCredit] = useState(false)
  const [creditToRedeem, setCreditToRedeem] = useState(0)

  // Custom checkout fields (keyed by field id)
  const [customFields, setCustomFields] = useState<Record<string, string>>({})

  // Coupon
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{ couponId: string; couponCode: string; discount: number; message: string; freeShipping?: boolean } | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  // Delivery date
  const [deliveryDate, setDeliveryDate] = useState("")

  // Referral code
  const [referralCode, setReferralCode] = useState("")

  // Express checkout: pre-fill saved address for logged-in users
  useEffect(() => {
    if (!userId) return
    fetch("/api/user/addresses")
      .then(r => r.json())
      .then(d => {
        const addrs = d.addresses || []
        if (!addrs.length) return
        setSavedAddresses(addrs)
        const def = addrs.find((a: any) => a.isDefault) || addrs[0]
        setSelectedAddressId(def.id)
        setAddress({ name: def.fullName, phone: def.phone, division: def.division, district: def.district, area: def.area, fullAddress: def.address })
        setExpressReady(true)
        setStep(2)
        trackInitiateCheckout({ value: 0, items: [] })
      })
      .catch(() => {})
  }, [userId])

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const { rate: zoneRate, freeAbove: zoneFreeAbove } = resolveZoneRate(address.district, shippingZones, shippingChargeAmount)
  const effectiveFreeThreshold = zoneFreeAbove ?? freeShippingThreshold
  const shippingCharge = (subtotal >= effectiveFreeThreshold || appliedCoupon?.freeShipping) ? 0 : zoneRate
  const taxAmount = taxEnabled ? Math.round((subtotal * taxRate) / 100) : 0
  const giftWrapAmount = giftWrap ? giftWrapCharge : 0
  const loyaltyDiscount = redeemPoints ? Math.min(pointsToRedeem, loyaltyMaxDiscount) : 0
  const creditDiscount = redeemCredit ? Math.min(creditToRedeem, storeCreditBalance) : 0
  const couponDiscount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shippingCharge + taxAmount + giftWrapAmount - loyaltyDiscount - creditDiscount - couponDiscount)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError("")
    try {
      const res = await fetch("/api/store/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, items }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error); setAppliedCoupon(null) }
      else setAppliedCoupon(data)
    } catch { setCouponError("Failed to apply coupon") }
    finally { setCouponLoading(false) }
  }

  const minDeliveryDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]
  })()
  const maxDeliveryDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 8); return d.toISOString().split("T")[0]
  })()

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
    trackInitiateCheckout({
      value: total,
      items: items.map((i) => ({ productId: i.productId, variantSku: i.variantId, name: i.name, price: i.price, quantity: i.quantity })),
    })
    try {
      const res = await fetch("/api/store/deposit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: address.phone, total }),
      })
      if (res.ok) setDepositInfo(await res.json())
    } catch { /* non-critical */ }
  }

  const handleSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    trackAddPaymentInfo(total)
    setStep(3)
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const orderRes = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          address,
          paymentMethod,
          subtotal,
          shippingCharge,
          total,
          note: orderNote || null,
          giftWrap,
          giftMessage: giftWrap ? giftMessage : null,
          giftWrapCharge: giftWrapAmount,
          isGuest,
          guestEmail: isGuest ? guestEmail : null,
          userId: userId || null,
          loyaltyPointsRedeemed: redeemPoints ? Math.min(pointsToRedeem * 100, loyaltyBalance) : 0,
          loyaltyDiscount,
          storeCreditRedeemed: redeemCredit ? creditDiscount : 0,
          customFields: Object.keys(customFields).length > 0 ? customFields : null,
          couponId: appliedCoupon?.couponId || null,
          couponDiscount,
          deliveryDate: deliveryDate || null,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error)

      if (paymentMethod === "COD" && orderData.depositAmount > 0) {
        const bkashRes = await fetch("/api/payments/bkash/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId, type: "deposit" }),
        })
        const bkashData = await bkashRes.json()
        if (!bkashRes.ok) throw new Error(bkashData.error)
        clearCart()
        window.location.href = bkashData.bkashURL
      } else if (paymentMethod === "BKASH") {
        const bkashRes = await fetch("/api/payments/bkash/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId }),
        })
        const bkashData = await bkashRes.json()
        if (!bkashRes.ok) throw new Error(bkashData.error)
        clearCart()
        window.location.href = bkashData.bkashURL
      } else if (paymentMethod === "NAGAD") {
        const nagadRes = await fetch("/api/payments/nagad/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId }),
        })
        const nagadData = await nagadRes.json()
        if (!nagadRes.ok) throw new Error(nagadData.error)
        clearCart()
        window.location.href = nagadData.nagadURL
      } else if (paymentMethod === "SSLCOMMERZ") {
        const sslRes = await fetch("/api/payments/sslcommerz/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId }),
        })
        const sslData = await sslRes.json()
        if (!sslRes.ok) throw new Error(sslData.error)
        clearCart()
        window.location.href = sslData.GatewayPageURL
      } else {
        // Apply referral reward if code was entered
        if (referralCode.trim() && orderData.orderId) {
          fetch("/api/store/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode: referralCode.trim(), orderId: orderData.orderId }),
          }).catch(() => {})
        }
        clearCart()
        router.push(`/order/${orderData.orderId}?placed=1`)
      }
    } catch (error: any) {
      alert("Failed to place order: " + error.message)
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-novo-border rounded-2xl">
        <h2 className="text-2xl font-heading font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => router.push("/shop")} className="px-8 py-3 bg-novo-black text-white font-medium hover:bg-novo-blue transition-colors rounded-full">
          Continue Shopping
        </button>
      </div>
    )
  }

  const inputCls = "w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-4 py-3 text-sm outline-none transition-all"

  return (
    <div className="flex flex-col lg:flex-row gap-10 items-start">
      <div className="w-full lg:w-2/3 space-y-6">

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2 md:px-10 relative">
          <div className="absolute top-4 left-0 w-full h-[1px] bg-novo-border -z-10" />
          {["Shipping", "Payment", "Extras & Review"].map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-novo-bg px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${step >= i + 1 ? "border-novo-black bg-novo-black text-white" : "border-novo-border bg-white text-novo-text-muted"}`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest text-center ${step >= i + 1 ? "text-novo-black" : "text-novo-text-muted"}`}>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Address */}
        <div className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${step === 1 ? "border-novo-black shadow-lg shadow-black/5" : "border-novo-border opacity-70"}`}>
          <div className="bg-novo-muted/30 px-6 py-4 flex items-center justify-between border-b border-novo-border">
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${step === 1 ? "text-novo-black" : "text-novo-text-muted"}`} />
              <h2 className="font-heading font-bold text-lg">Delivery Address</h2>
            </div>
            {step > 1 && <button onClick={() => setStep(1)} className="text-xs font-bold uppercase tracking-widest text-novo-blue hover:text-novo-black transition-colors">Edit</button>}
          </div>

          {step === 1 && (
            <div className="p-6">
              {/* Guest vs account toggle */}
              <div className="flex gap-3 mb-6">
                <button type="button" onClick={() => setIsGuest(false)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all ${!isGuest ? "bg-novo-black text-white border-novo-black" : "border-novo-border text-novo-text-muted hover:border-novo-black"}`}>
                  <User className="w-3.5 h-3.5 inline mr-1.5" />Login / Register
                </button>
                <button type="button" onClick={() => setIsGuest(true)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg border transition-all ${isGuest ? "bg-novo-black text-white border-novo-black" : "border-novo-border text-novo-text-muted hover:border-novo-black"}`}>
                  Continue as Guest
                </button>
              </div>

              {!isGuest && (
                <p className="text-xs text-novo-text-muted mb-4 p-3 bg-novo-muted rounded-lg">
                  <a href="/login?redirect=/checkout" className="text-novo-blue font-bold hover:underline">Log in</a> to use saved addresses & earn loyalty points. Or fill in below to continue as guest.
                </p>
              )}

              <form onSubmit={handleSubmitStep1} className="space-y-4">
                {isGuest && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Email (for order updates)</label>
                    <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Full Name *</label>
                    <input required value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Phone *</label>
                    <input required value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Division *</label>
                    <select
                      required
                      value={address.division}
                      onChange={e => setAddress({ ...address, division: e.target.value, district: "", area: "" })}
                      className={inputCls}
                    >
                      <option value="">Select Division</option>
                      {BD_GEO.map(div => (
                        <option key={div.name} value={div.name}>{div.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">District *</label>
                    <select
                      required
                      value={address.district}
                      onChange={e => setAddress({ ...address, district: e.target.value, area: "" })}
                      className={inputCls}
                      disabled={!address.division}
                    >
                      <option value="">Select District</option>
                      {(BD_GEO.find(d => d.name === address.division)?.districts ?? []).map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Upazila / Thana *</label>
                    <select
                      required
                      value={address.area}
                      onChange={e => setAddress({ ...address, area: e.target.value })}
                      className={inputCls}
                      disabled={!address.district}
                    >
                      <option value="">Select Upazila / Thana</option>
                      {(BD_GEO.find(d => d.name === address.division)?.districts.find(d => d.name === address.district)?.upazilas ?? []).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">Full Address *</label>
                    <textarea required rows={2} value={address.fullAddress} onChange={e => setAddress({ ...address, fullAddress: e.target.value })} className={`${inputCls} resize-none`} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" className="px-8 py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-novo-blue transition-colors rounded-full text-xs">
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
          {step > 1 && (
            <div className="p-6 text-sm text-novo-text-muted">
              {expressReady && savedAddresses.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {savedAddresses.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => { setSelectedAddressId(a.id); setAddress({ name: a.fullName, phone: a.phone, division: a.division, district: a.district, area: a.area, fullAddress: a.address }) }}
                      className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${selectedAddressId === a.id ? "border-novo-black bg-novo-black text-white" : "border-novo-border text-novo-text-muted hover:border-novo-blue"}`}
                    >
                      {a.label || "Address"}
                    </button>
                  ))}
                </div>
              )}
              <p className="font-medium text-novo-black">{address.name} ({address.phone})</p>
              <p>{address.fullAddress}, {address.area}, {address.district}, {address.division}</p>
              {isGuest && guestEmail && <p className="text-novo-blue mt-1 text-xs">Guest: {guestEmail}</p>}
            </div>
          )}
        </div>

        {/* Step 2: Payment */}
        <div className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${step === 2 ? "border-novo-black shadow-lg shadow-black/5" : "border-novo-border opacity-70"}`}>
          <div className="bg-novo-muted/30 px-6 py-4 flex items-center justify-between border-b border-novo-border">
            <div className="flex items-center gap-3">
              <CreditCard className={`w-5 h-5 ${step === 2 ? "text-novo-black" : "text-novo-text-muted"}`} />
              <h2 className="font-heading font-bold text-lg">Payment Method</h2>
            </div>
            {step > 2 && <button onClick={() => setStep(2)} className="text-xs font-bold uppercase tracking-widest text-novo-blue hover:text-novo-black transition-colors">Edit</button>}
          </div>

          {step === 2 && (
            <div className="p-6">
              <form onSubmit={handleSubmitStep2} className="space-y-4">
                {enabledPaymentMethods.includes("COD") && (
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === "COD" ? "border-novo-black bg-novo-muted/20 shadow-sm" : "border-novo-border hover:border-novo-black/30"}`}>
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="w-4 h-4 accent-novo-black" />
                    <div className="ml-4">
                      <span className="font-bold block text-sm">Cash on Delivery</span>
                      <span className="text-xs text-novo-text-muted">Pay in cash when your order arrives</span>
                      {paymentMethod === "COD" && depositInfo?.required && (
                        <p className="text-xs text-novo-blue font-medium mt-1.5">
                          ৳{depositInfo.amount} advance via bKash required. Remaining ৳{(total - depositInfo.amount).toLocaleString()} paid on delivery.
                        </p>
                      )}
                    </div>
                  </label>
                )}
                {enabledPaymentMethods.includes("BKASH") && (
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === "BKASH" ? "border-novo-black bg-novo-muted/20 shadow-sm" : "border-novo-border hover:border-novo-black/30"}`}>
                    <input type="radio" name="payment" value="BKASH" checked={paymentMethod === "BKASH"} onChange={() => setPaymentMethod("BKASH")} className="w-4 h-4 accent-novo-black" />
                    <div className="ml-4 flex items-center gap-2">
                      <span className="font-bold block text-sm">bKash</span>
                      <span className="text-[10px] bg-pink-100 text-pink-700 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Fast</span>
                    </div>
                  </label>
                )}
                {enabledPaymentMethods.includes("NAGAD") && (
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === "NAGAD" ? "border-novo-black bg-novo-muted/20 shadow-sm" : "border-novo-border hover:border-novo-black/30"}`}>
                    <input type="radio" name="payment" value="NAGAD" checked={paymentMethod === "NAGAD"} onChange={() => setPaymentMethod("NAGAD")} className="w-4 h-4 accent-novo-black" />
                    <div className="ml-4">
                      <span className="font-bold block text-sm">Nagad</span>
                    </div>
                  </label>
                )}
                {enabledPaymentMethods.includes("SSLCOMMERZ") && (
                  <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-300 ${paymentMethod === "SSLCOMMERZ" ? "border-novo-black bg-novo-muted/20 shadow-sm" : "border-novo-border hover:border-novo-black/30"}`}>
                    <input type="radio" name="payment" value="SSLCOMMERZ" checked={paymentMethod === "SSLCOMMERZ"} onChange={() => setPaymentMethod("SSLCOMMERZ")} className="w-4 h-4 accent-novo-black" />
                    <div className="ml-4">
                      <span className="font-bold block text-sm">Card / Online Banking</span>
                      <span className="text-xs text-novo-text-muted">Visa, Mastercard, DBBL, Dutch-Bangla via SSLCommerz</span>
                    </div>
                  </label>
                )}
                {/* Preferred delivery date */}
                <div className="border border-novo-border rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-novo-text-muted">
                    <Calendar className="w-4 h-4" /> Preferred Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    min={minDeliveryDate}
                    max={maxDeliveryDate}
                    onChange={e => setDeliveryDate(e.target.value)}
                    className={inputCls}
                  />
                  <p className="text-xs text-novo-text-muted">We will try our best to deliver by your preferred date.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="px-8 py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-novo-blue transition-colors rounded-full text-xs">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
          {step > 2 && (
            <div className="p-6 text-sm space-y-1">
              <span className="font-bold text-novo-black bg-novo-muted px-3 py-1 rounded">
                {paymentMethod === "COD" ? "Cash on Delivery" : paymentMethod}
              </span>
              {deliveryDate && (
                <p className="text-xs text-novo-text-muted pt-2">Preferred delivery: {new Date(deliveryDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Extras & Review */}
        <div className={`bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${step === 3 ? "border-novo-black shadow-lg shadow-black/5" : "border-novo-border opacity-70"}`}>
          <div className="bg-novo-muted/30 px-6 py-4 flex items-center border-b border-novo-border gap-3">
            <ClipboardCheck className={`w-5 h-5 ${step === 3 ? "text-novo-black" : "text-novo-text-muted"}`} />
            <h2 className="font-heading font-bold text-lg">Extras & Review</h2>
          </div>

          {step === 3 && (
            <div className="p-6 space-y-6">

              {/* Custom checkout fields for step 3 */}
              {checkoutFields.filter(f => f.step === 3).map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">
                    {field.label}{field.isRequired ? " *" : ""}
                  </label>
                  {field.type === "SELECT" ? (
                    <select
                      required={field.isRequired}
                      value={customFields[field.id] || ""}
                      onChange={e => setCustomFields({ ...customFields, [field.id]: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Select…</option>
                      {(field.options as string[]).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "TEXTAREA" ? (
                    <textarea
                      required={field.isRequired}
                      rows={2}
                      value={customFields[field.id] || ""}
                      onChange={e => setCustomFields({ ...customFields, [field.id]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      className={`${inputCls} resize-none`}
                    />
                  ) : (
                    <input
                      type={field.type === "DATE" ? "date" : field.type === "NUMBER" ? "number" : "text"}
                      required={field.isRequired}
                      value={customFields[field.id] || ""}
                      onChange={e => setCustomFields({ ...customFields, [field.id]: e.target.value })}
                      placeholder={field.placeholder || ""}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}

              {/* Loyalty points */}
              {userId && loyaltyBalance > 0 && (
                <div className="border border-novo-border rounded-xl overflow-hidden">
                  <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-novo-muted/20 transition-colors">
                    <input type="checkbox" checked={redeemPoints} onChange={e => { setRedeemPoints(e.target.checked); if (!e.target.checked) setPointsToRedeem(0) }} className="w-4 h-4 accent-novo-black rounded" />
                    <Star className="w-5 h-5 text-novo-blue shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Redeem Loyalty Points</p>
                      <p className="text-xs text-novo-text-muted">You have {loyaltyBalance.toLocaleString()} points · max discount ৳{loyaltyMaxDiscount}</p>
                    </div>
                  </label>
                  {redeemPoints && (
                    <div className="border-t border-novo-border p-4 bg-novo-muted/10 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted block">Discount amount (৳)</label>
                      <input
                        type="number"
                        min={1}
                        max={loyaltyMaxDiscount}
                        value={pointsToRedeem}
                        onChange={e => setPointsToRedeem(Math.min(Number(e.target.value), loyaltyMaxDiscount))}
                        className={inputCls}
                        placeholder={`Max ৳${loyaltyMaxDiscount}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Store credit */}
              {userId && storeCreditBalance > 0 && (
                <div className="border border-novo-border rounded-xl overflow-hidden">
                  <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-novo-muted/20 transition-colors">
                    <input type="checkbox" checked={redeemCredit} onChange={e => { setRedeemCredit(e.target.checked); if (!e.target.checked) setCreditToRedeem(0) }} className="w-4 h-4 accent-novo-black rounded" />
                    <Wallet className="w-5 h-5 text-novo-success shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Use Store Credit</p>
                      <p className="text-xs text-novo-text-muted">Balance: ৳{storeCreditBalance.toLocaleString()}</p>
                    </div>
                  </label>
                  {redeemCredit && (
                    <div className="border-t border-novo-border p-4 bg-novo-muted/10 space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted block">Amount to use (৳)</label>
                      <input
                        type="number"
                        min={1}
                        max={storeCreditBalance}
                        value={creditToRedeem}
                        onChange={e => setCreditToRedeem(Math.min(Number(e.target.value), storeCreditBalance))}
                        className={inputCls}
                        placeholder={`Max ৳${storeCreditBalance}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Coupon code */}
              <div className="border border-novo-border rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-novo-text-muted">
                  <Tag className="w-4 h-4" /> Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-novo-success/10 border border-novo-success/30 rounded-lg px-4 py-3">
                    <div>
                      <p className="font-bold text-sm text-novo-success">{appliedCoupon.couponCode}</p>
                      <p className="text-xs text-novo-text-muted">{appliedCoupon.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setAppliedCoupon(null); setCouponCode("") }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                    >Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError("") }}
                      placeholder="Enter coupon code"
                      className={`${inputCls} flex-1`}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-5 py-3 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-novo-blue transition-colors disabled:opacity-50 whitespace-nowrap"
                    >{couponLoading ? "..." : "Apply"}</button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </div>

              {/* Order note */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-novo-text-muted">
                  <MessageSquare className="w-4 h-4" /> Order Note / Special Instructions
                </label>
                <textarea
                  rows={3}
                  value={orderNote}
                  onChange={e => setOrderNote(e.target.value)}
                  placeholder="Any special delivery instructions, preferred time, etc."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Gift wrap */}
              {giftWrapEnabled && (
                <div className="border border-novo-border rounded-xl overflow-hidden">
                  <label className="flex items-center gap-4 p-4 cursor-pointer hover:bg-novo-muted/20 transition-colors">
                    <input type="checkbox" checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} className="w-4 h-4 accent-novo-black rounded" />
                    <Gift className="w-5 h-5 text-novo-blue shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Add Gift Wrapping</p>
                      <p className="text-xs text-novo-text-muted">Premium gift box with ribbon — ৳{giftWrapCharge}</p>
                    </div>
                    <span className="font-mono font-bold text-sm">+৳{giftWrapCharge}</span>
                  </label>
                  {giftWrap && (
                    <div className="border-t border-novo-border p-4 bg-novo-muted/10">
                      <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted block mb-2">Gift Message (max 160 characters)</label>
                      <textarea
                        rows={3}
                        maxLength={160}
                        value={giftMessage}
                        onChange={e => setGiftMessage(e.target.value)}
                        placeholder="Write a personal message for the recipient..."
                        className={`${inputCls} resize-none`}
                      />
                      <p className="text-xs text-novo-text-muted mt-1 text-right">{giftMessage.length}/160</p>
                    </div>
                  )}
                </div>
              )}

              {/* Referral code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-novo-text-muted flex items-center gap-2">
                  <Star className="w-4 h-4" /> Referral Code (optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value)}
                  placeholder="Enter a friend's referral code"
                  className={inputCls}
                />
                <p className="text-xs text-novo-text-muted">First-time orders only — both you and your friend get ৳100 store credit.</p>
              </div>

              <p className="text-xs text-novo-text-muted">By placing this order you agree to our Terms of Service and Privacy Policy.</p>
              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-novo-blue hover:shadow-lg hover:shadow-novo-blue/20 transition-all duration-300 rounded-full"
              >
                {loading ? "Processing Securely..." : "Confirm & Place Order"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary Sidebar */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white border border-novo-border rounded-2xl p-6 sticky top-24">
          <h2 className="text-xl font-heading font-bold mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-4">
                <div className="relative h-20 w-16 bg-novo-muted shrink-0 rounded overflow-hidden">
                  <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 text-sm flex flex-col justify-center">
                  <h4 className="font-medium line-clamp-1">{item.name}</h4>
                  <p className="text-novo-text-muted text-xs mt-0.5">{item.size} / {item.color}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-novo-text-muted">Qty: {item.quantity}</span>
                    <span className="font-mono font-bold">৳{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-novo-border pt-6 space-y-3 text-sm">
            <div className="flex justify-between text-novo-text-muted">
              <span>Subtotal</span>
              <span className="font-mono">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-novo-text-muted">
              <span>Shipping</span>
              <span className="font-mono">{shippingCharge === 0 ? "Free" : `৳${shippingCharge}`}</span>
            </div>
            {taxEnabled && taxAmount > 0 && (
              <div className="flex justify-between text-novo-text-muted">
                <span>{taxLabel} ({taxRate}%)</span>
                <span className="font-mono">৳{taxAmount.toLocaleString()}</span>
              </div>
            )}
            {giftWrap && (
              <div className="flex justify-between text-novo-text-muted">
                <span>Gift Wrapping</span>
                <span className="font-mono">৳{giftWrapCharge}</span>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-novo-text-muted">
                <span>Loyalty Points</span>
                <span className="font-mono text-novo-success">−৳{loyaltyDiscount.toLocaleString()}</span>
              </div>
            )}
            {creditDiscount > 0 && (
              <div className="flex justify-between text-novo-text-muted">
                <span>Store Credit</span>
                <span className="font-mono text-novo-success">−৳{creditDiscount.toLocaleString()}</span>
              </div>
            )}
            {appliedCoupon?.freeShipping && (
              <div className="flex justify-between text-novo-success text-sm">
                <span>Coupon ({appliedCoupon.couponCode})</span>
                <span className="font-mono">Free shipping</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-novo-text-muted">
                <span>Coupon ({appliedCoupon?.couponCode})</span>
                <span className="font-mono text-novo-success">−৳{couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-novo-border pt-4 font-bold text-lg items-center">
              <span>Total</span>
              <span className="font-mono text-2xl">৳{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
