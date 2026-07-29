import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Check, X, ShoppingBag, MapPin, CreditCard, Gift, Package, Truck, Home, Ban } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getBalance } from "@/lib/loyalty"
import OrderMessages from "@/components/store/OrderMessages"
import PurchaseTracker from "@/components/store/PurchaseTracker"
import PostPurchaseUpsell from "@/components/store/PostPurchaseUpsell"

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const

const STATUS_META: Record<string, { label: string; icon: any }> = {
  PENDING: { label: "Order Placed", icon: ShoppingBag },
  CONFIRMED: { label: "Confirmed", icon: Check },
  PACKED: { label: "Packed", icon: Package },
  SHIPPED: { label: "Shipped", icon: Truck },
  DELIVERED: { label: "Delivered", icon: Home },
}

export default async function OrderConfirmationPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string }> 
}) {
  const { id } = await params
  const { payment } = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 }
            }
          }
        }
      },
      payment: true,
      delivery: true,
      statusLogs: { orderBy: { createdAt: "asc" } },
    }
  })

  if (!order) {
    redirect("/shop")
  }
  
  let pointsEarned = 0
  let currentBalance = 0
  if (order.userId) {
    const pointsEntry = await prisma.loyaltyPoint.findFirst({
      where: { orderId: id, type: "EARNED" }
    })
    pointsEarned = pointsEntry?.points || 0
    currentBalance = await getBalance(order.userId)
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl animate-in fade-in duration-500">
      <div className="text-center mb-16">
        {payment === "failed" ? (
          <>
            <div className="w-24 h-24 mx-auto bg-novo-error/10 text-novo-error rounded-full flex items-center justify-center mb-6">
              <X className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-novo-black mb-4">Payment Failed</h1>
            <p className="text-novo-text-muted max-w-md mx-auto mb-8">We couldn't process your payment. Please try again with a different payment method.</p>
            <Link href="/checkout" className="inline-flex px-8 py-4 bg-novo-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue transition-colors">
              Retry Payment
            </Link>
          </>
        ) : (
          <>
            <div className="w-24 h-24 mx-auto bg-novo-success/10 text-novo-success rounded-full flex items-center justify-center mb-6 animate-bounce">
              <Check className="w-12 h-12" strokeWidth={3} />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-4">Order Confirmed</h1>
            <p className="text-novo-text-muted max-w-md mx-auto mb-6">Thank you for shopping with NovoBlink. Your order is being processed.</p>
            <div className="inline-flex items-center gap-2 bg-novo-surface border border-novo-border px-6 py-3 rounded-lg shadow-sm">
              <span className="text-xs uppercase tracking-widest text-novo-text-muted font-bold">Order #</span>
              <span className="font-mono font-bold text-lg">{order.orderNumber}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-3/5 space-y-8">
          {/* Status Timeline */}
          {order.status === "CANCELLED" || order.status === "RETURNED" ? (
            <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 text-novo-error">
                <Ban className="w-5 h-5" />
                <h2 className="text-lg font-heading font-bold">
                  Order {order.status === "CANCELLED" ? "Cancelled" : "Returned"}
                </h2>
              </div>
            </section>
          ) : (
            <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-heading font-bold mb-8">Order Status</h2>
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-novo-border" />
                {STATUS_STEPS.map((step, idx) => {
                  const currentIdx = STATUS_STEPS.indexOf(order.status as any)
                  const isDone = currentIdx >= idx
                  const log = order.statusLogs.find((l) => l.status === step)
                  const Icon = STATUS_META[step].icon
                  return (
                    <div key={step} className="relative flex flex-col items-center gap-2 flex-1 z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isDone ? "bg-novo-blue border-novo-blue text-white" : "bg-white border-novo-border text-novo-text-muted"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${isDone ? "text-novo-black" : "text-novo-text-muted"}`}>
                        {STATUS_META[step].label}
                      </p>
                      {log && (
                        <p className="text-[10px] text-novo-text-muted text-center">
                          {new Date(log.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Order Summary */}
          <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-heading font-bold mb-6 flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-novo-blue" /> Items Ordered
            </h2>
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-16 bg-novo-muted shrink-0 rounded overflow-hidden">
                    <Image src={item.product.images[0]?.url || "/placeholder.jpg"} alt={item.productName} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 text-sm flex flex-col justify-center">
                    <h4 className="font-medium line-clamp-1">{item.productName}</h4>
                    <p className="text-novo-text-muted text-xs mt-0.5">{item.size} / {item.color}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-novo-text-muted">Qty: {item.quantity}</span>
                      <span className="font-mono font-bold">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-novo-border pt-6 space-y-3 text-sm">
              <div className="flex justify-between text-novo-text-muted">
                <span>Subtotal</span>
                <span className="font-mono">৳{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-novo-success">
                  <span>Discount</span>
                  <span className="font-mono">- ৳{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-novo-text-muted">
                <span>Shipping</span>
                <span className="font-mono">৳{Number(order.shippingCharge).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-4 font-bold text-lg items-center">
                <span>Total Paid</span>
                <span className="font-mono text-2xl">৳{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="w-full lg:w-2/5 space-y-8">
          {/* Payment Info */}
          <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-novo-blue" /> Payment
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between pb-3 border-b border-novo-muted">
                <span className="text-novo-text-muted">Method</span>
                <span className="font-bold">{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-novo-muted">
                <span className="text-novo-text-muted">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  order.paymentStatus === 'PAID' ? 'bg-novo-success/10 text-novo-success' : 'bg-orange-100 text-orange-800'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-novo-text-muted">Transaction ID</span>
                  <span className="font-mono">{order.payment.transactionId}</span>
                </div>
              )}
              {order.depositPaid && (
                <div className="mt-3 p-3 bg-novo-blue/10 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span>Advance paid (bKash)</span>
                    <span className="font-mono">৳{Number(order.depositAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-novo-text-muted">
                    <span>Due on delivery</span>
                    <span className="font-mono">৳{(Number(order.total) - Number(order.depositAmount)).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Delivery Info */}
          <section className="bg-white border border-novo-border rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-heading font-bold mb-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-novo-blue" /> Delivery
            </h2>
            <div className="text-sm space-y-1.5 text-novo-text-muted bg-novo-muted/30 p-4 rounded-lg">
              <p className="font-bold text-novo-black">{order.shippingName}</p>
              <p>{order.shippingPhone}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingArea}, {order.shippingDistrict}</p>
              <p>{order.shippingDivision}</p>
            </div>
            <div className="mt-4 p-4 border border-novo-border text-sm rounded-lg flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-novo-blue mt-1.5 shrink-0" />
              <div>
                <p className="font-bold">Estimated Delivery</p>
                <p className="text-novo-text-muted">3-5 business days. You will receive tracking details via SMS.</p>
              </div>
            </div>
          </section>

          {/* Loyalty Points */}
          {order.userId && pointsEarned > 0 && (
            <section className="bg-novo-black text-white rounded-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-novo-blue/20 rounded-full blur-xl" />
              <h2 className="text-lg font-heading font-bold mb-2 flex items-center gap-3">
                <Gift className="w-5 h-5 text-novo-blue" /> NovoBlink Club
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                You earned <span className="text-novo-blue font-bold">{pointsEarned} points</span> from this order!
              </p>
              <div className="bg-white/10 rounded-lg p-3 inline-block">
                <p className="text-xs text-gray-400">Current Balance</p>
                <p className="font-mono font-bold text-lg">{currentBalance} points</p>
              </div>
            </section>
          )}

          {/* Order Messages */}
          <OrderMessages orderId={order.id} />
        </div>
      </div>
      
      {payment !== "failed" && (
        <PurchaseTracker order={{
          id: order.id,
          orderNumber: order.orderNumber,
          total: Number(order.total),
          items: order.items.map((i: any) => ({
            productId: i.productId,
            name: i.productName,
            price: Number(i.price),
            quantity: i.quantity,
          })),
        }} />
      )}

      {payment !== "failed" && (
        <PostPurchaseUpsell orderTotal={Number(order.total)} />
      )}

      <div className="mt-16 text-center border-t border-novo-border pt-12 flex items-center justify-center gap-8">
        <Link href={`/order/${order.id}/invoice`} className="inline-block text-xs font-bold uppercase tracking-widest border-b border-novo-black pb-1 hover:text-novo-blue hover:border-novo-blue transition-colors">
          Download Invoice
        </Link>
        <Link href="/shop" className="inline-block text-xs font-bold uppercase tracking-widest border-b border-novo-black pb-1 hover:text-novo-blue hover:border-novo-blue transition-colors">
          Continue Shopping &rarr;
        </Link>
      </div>
    </div>
  )
}
