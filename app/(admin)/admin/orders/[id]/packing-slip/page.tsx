import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { take: 1 } } } } },
    },
  })
  if (!order) notFound()

  const settings = await prisma.setting.findMany({ where: { key: { in: ["store_name", "store_logo", "support_phone"] } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "NovoBlink"

  return (
    <html>
      <head>
        <title>Packing Slip — {order.orderNumber}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 20px; max-width: 148mm; }
          .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .store-name { font-size: 22px; font-weight: bold; letter-spacing: 4px; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
          .value { font-size: 13px; font-weight: bold; }
          .section { margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .item-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eee; }
          .check-box { width: 14px; height: 14px; border: 2px solid #000; display: inline-block; margin-right: 8px; flex-shrink: 0; }
          .badge { display: inline-block; padding: 2px 8px; border: 1px solid #000; font-size: 10px; font-weight: bold; letter-spacing: 1px; }
          @media print { button { display: none; } }
        `}</style>
      </head>
      <body>
        <div className="header" style={{ borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 4 }}>{storeName}</div>
          <div style={{ fontSize: 10, color: "#666" }}>PACKING SLIP</div>
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: "bold" }}>{order.orderNumber}</span>
            <span style={{ fontSize: 10, color: "#666" }}>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div style={{ marginBottom: 12, borderBottom: "1px dashed #ccc", paddingBottom: 10 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#666", marginBottom: 4 }}>Ship To</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>{order.shippingName}</div>
          <div>{order.shippingPhone}</div>
          <div>{order.shippingAddress}</div>
          <div>{order.shippingArea}, {order.shippingDistrict}, {order.shippingDivision}</div>
        </div>

        <div style={{ marginBottom: 12, borderBottom: "1px dashed #ccc", paddingBottom: 10 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#666", marginBottom: 6 }}>Items to Pack</div>
          {order.items.map((item, i) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ width: 14, height: 14, border: "2px solid #000", display: "inline-block", marginRight: 8, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>{item.productName}</div>
                <div style={{ fontSize: 10, color: "#666" }}>{item.size} / {item.color}</div>
              </div>
              <div style={{ fontWeight: "bold", fontSize: 14, marginLeft: 8 }}>×{item.quantity}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666" }}>Payment</div>
            <div style={{ fontWeight: "bold" }}>{order.paymentMethod} — {order.paymentStatus}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#666" }}>Total</div>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>৳{Number(order.total).toLocaleString()}</div>
          </div>
        </div>

        {order.note && (
          <div style={{ padding: 8, border: "1px solid #000", marginBottom: 12, fontSize: 11 }}>
            <span style={{ fontWeight: "bold" }}>Note: </span>{order.note}
          </div>
        )}
        {order.giftWrap && (
          <div style={{ padding: 8, border: "2px solid #000", marginBottom: 12, fontSize: 11, textAlign: "center", fontWeight: "bold" }}>
            🎁 GIFT WRAPPED{order.giftMessage ? ` — "${order.giftMessage}"` : ""}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 12, borderTop: "1px dashed #ccc" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL || "https://NovoBlink.com.bd"}/track/${order.orderNumber}`)}`}
            alt="Track order QR"
            width={80}
            height={80}
            style={{ flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#666" }}>Scan to track your order</div>
            <div style={{ fontWeight: "bold", fontSize: 11, marginTop: 2 }}>{order.orderNumber}</div>
            <div style={{ fontSize: 10, color: "#999", marginTop: 8 }}>Thank you for shopping with us!</div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          style={{ position: "fixed", bottom: 20, right: 20, padding: "10px 20px", background: "#000", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
        >
          Print
        </button>
      </body>
    </html>
  )
}
