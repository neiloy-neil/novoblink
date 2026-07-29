import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import InvoicePrintButton from "@/components/store/InvoicePrintButton"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    }),
    prisma.setting.findMany({ where: { key: { in: ["store_name", "support_email"] } } }),
  ])

  if (!order) notFound()

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const storeName = settingsMap.store_name || "NovoBlink"
  const supportEmail = settingsMap.support_email || "support@NovoBlink.com.bd"

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 print:p-0">
      <div className="flex items-center justify-between mb-10 print:hidden">
        <h1 className="text-2xl font-heading font-bold">Invoice</h1>
        <InvoicePrintButton />
      </div>

      <div className="border border-novo-border rounded-2xl p-8 print:border-0 print:rounded-none print:p-0">
        <div className="flex items-start justify-between mb-8 pb-8 border-b border-novo-border">
          <div>
            <h2 className="text-2xl font-heading font-bold">{storeName}</h2>
            <p className="text-xs text-novo-text-muted mt-1">{supportEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-novo-text-muted font-bold">Invoice</p>
            <p className="font-mono font-bold">{order.orderNumber}</p>
            <p className="text-xs text-novo-text-muted mt-1">{new Date(order.createdAt).toLocaleDateString("en-BD")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-novo-text-muted font-bold mb-2">Billed To</p>
            <p className="font-medium">{order.shippingName}</p>
            <p className="text-novo-text-muted">{order.shippingPhone}</p>
            <p className="text-novo-text-muted">{order.shippingAddress}</p>
            <p className="text-novo-text-muted">{order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-novo-text-muted font-bold mb-2">Payment</p>
            <p className="font-medium">{order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}</p>
            <p className="text-novo-text-muted">Status: {order.paymentStatus}</p>
            {Number(order.depositAmount) > 0 && (
              <p className="text-novo-text-muted">
                Advance paid: ৳{Number(order.depositAmount).toLocaleString()}
                {order.depositPaid ? "" : " (pending)"}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-novo-border text-xs uppercase tracking-widest text-novo-text-muted">
              <th className="text-left py-2 font-bold">Item</th>
              <th className="text-center py-2 font-bold">Qty</th>
              <th className="text-right py-2 font-bold">Price</th>
              <th className="text-right py-2 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-novo-border/50">
                <td className="py-3">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-novo-text-muted">{item.size} / {item.color}</p>
                </td>
                <td className="text-center py-3">{item.quantity}</td>
                <td className="text-right py-3 font-mono">৳{Number(item.price).toLocaleString()}</td>
                <td className="text-right py-3 font-mono">৳{(Number(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-novo-text-muted">Subtotal</span>
              <span className="font-mono">৳{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-novo-success">
                <span>Discount</span>
                <span className="font-mono">-৳{Number(order.discount).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-novo-text-muted">Shipping</span>
              <span className="font-mono">৳{Number(order.shippingCharge).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-novo-border">
              <span>Total</span>
              <span className="font-mono">৳{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
