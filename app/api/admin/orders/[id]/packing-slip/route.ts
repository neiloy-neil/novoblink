import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) return new NextResponse("Order not found", { status: 404 })

  const settings = await prisma.setting.findMany({ where: { key: { in: ["store_name", "support_phone"] } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "NovoBlink"

  const date = new Date(order.createdAt)
  const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
  const total = Number(order.total).toLocaleString("en-BD")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://novoblink.store"
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${siteUrl}/track?order=${order.orderNumber}`)}`

  const itemsHtml = order.items.map(item => `
    <div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid #eee">
      <div style="width:14px;height:14px;border:2px solid #000;display:inline-block;margin-right:8px;flex-shrink:0"></div>
      <div style="flex:1">
        <div style="font-weight:bold;font-size:12px">${escHtml(item.productName)}</div>
        ${item.size || item.color ? `<div style="font-size:10px;color:#666">${escHtml([item.size, item.color].filter(Boolean).join(" / "))}</div>` : ""}
      </div>
      <div style="font-weight:bold;font-size:14px;margin-left:8px">×${item.quantity}</div>
    </div>
  `).join("")

  const noteHtml = order.note
    ? `<div style="padding:8px;border:1px solid #000;margin-bottom:12px;font-size:11px"><span style="font-weight:bold">Note: </span>${escHtml(order.note)}</div>`
    : ""

  const giftHtml = order.giftWrap
    ? `<div style="padding:8px;border:2px solid #000;margin-bottom:12px;font-size:11px;text-align:center;font-weight:bold">🎁 GIFT WRAPPED${order.giftMessage ? ` — "${escHtml(order.giftMessage)}"` : ""}</div>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Packing Slip — ${escHtml(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; padding: 20px; max-width: 148mm; }
    @media print { #print-btn { display: none; } }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px">
    <div style="font-size:22px;font-weight:bold;letter-spacing:4px">${escHtml(storeName)}</div>
    <div style="font-size:10px;color:#666">PACKING SLIP</div>
    <div style="margin-top:6px;display:flex;justify-content:space-between">
      <span style="font-size:16px;font-weight:bold">${escHtml(order.orderNumber)}</span>
      <span style="font-size:10px;color:#666">${dateStr}</span>
    </div>
  </div>

  <div style="margin-bottom:12px;border-bottom:1px dashed #ccc;padding-bottom:10px">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:4px">Ship To</div>
    <div style="font-size:13px;font-weight:bold">${escHtml(order.shippingName)}</div>
    <div>${escHtml(order.shippingPhone)}</div>
    <div>${escHtml(order.shippingAddress)}</div>
    <div>${escHtml([order.shippingArea, order.shippingDistrict, order.shippingDivision].filter(Boolean).join(", "))}</div>
  </div>

  <div style="margin-bottom:12px;border-bottom:1px dashed #ccc;padding-bottom:10px">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:6px">Items to Pack</div>
    ${itemsHtml}
  </div>

  <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:12px">
    <div>
      <div style="font-size:10px;text-transform:uppercase;color:#666">Payment</div>
      <div style="font-weight:bold">${escHtml(order.paymentMethod)} — ${escHtml(order.paymentStatus)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;text-transform:uppercase;color:#666">Total</div>
      <div style="font-weight:bold;font-size:16px">৳${total}</div>
    </div>
  </div>

  ${noteHtml}
  ${giftHtml}

  <div style="display:flex;align-items:center;gap:12px;margin-top:16px;padding-top:12px;border-top:1px dashed #ccc">
    <img src="${qrUrl}" alt="Track order QR" width="80" height="80" style="flex-shrink:0" />
    <div>
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666">Scan to track your order</div>
      <div style="font-weight:bold;font-size:11px;margin-top:2px">${escHtml(order.orderNumber)}</div>
      <div style="font-size:10px;color:#999;margin-top:8px">Thank you for shopping with us!</div>
    </div>
  </div>

  <button id="print-btn" onclick="window.print()" style="position:fixed;bottom:20px;right:20px;padding:10px 20px;background:#000;color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:bold">
    Print
  </button>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function escHtml(str: string | null | undefined): string {
  return (str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
