import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const ids = (req.nextUrl.searchParams.get("ids") || "").split(",").filter(Boolean)
  if (ids.length === 0) return new NextResponse("No order IDs provided", { status: 400 })

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })
  if (orders.length === 0) return new NextResponse("No orders found", { status: 404 })

  const settings = await prisma.setting.findMany({ where: { key: { in: ["store_name"] } } })
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const storeName = map.store_name || "NovoBlink"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://novoblink.store"

  const slipsHtml = orders.map(order => {
    const d = new Date(order.createdAt)
    const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
    const total = Number(order.total).toLocaleString("en-BD")
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${encodeURIComponent(`${siteUrl}/track/${order.orderNumber}`)}`

    const itemsHtml = order.items.map(item => `
      <div style="display:flex;align-items:center;padding:3px 0;border-bottom:1px solid #eee">
        <div style="width:10px;height:10px;border:1.5px solid #000;margin-right:5px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:bold;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(item.productName)}</div>
          ${item.size || item.color ? `<div style="font-size:9px;color:#666">${escHtml([item.size, item.color].filter(Boolean).join(" / "))}</div>` : ""}
        </div>
        <div style="font-weight:bold;font-size:11px;margin-left:4px;flex-shrink:0">×${item.quantity}</div>
      </div>`).join("")

    const noteHtml = order.note
      ? `<div style="margin-top:4px;padding:3px 5px;border:1px solid #000;font-size:9px"><b>Note:</b> ${escHtml(order.note)}</div>`
      : ""

    const giftHtml = order.giftWrap
      ? `<div style="margin-top:4px;padding:3px;border:2px solid #000;font-size:9px;text-align:center;font-weight:bold">🎁 GIFT${order.giftMessage ? ` — "${escHtml(order.giftMessage)}"` : ""}</div>`
      : ""

    return `<div class="slip">
  <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:1.5px solid #000;padding-bottom:4px;margin-bottom:5px">
    <div style="font-size:13px;font-weight:bold;letter-spacing:2px">${escHtml(storeName)}</div>
    <div style="font-size:9px;color:#666">${dateStr}</div>
  </div>

  <div style="font-size:11px;font-weight:bold;margin-bottom:5px">${escHtml(order.orderNumber)}</div>

  <div style="margin-bottom:5px;padding-bottom:5px;border-bottom:1px dashed #ccc">
    <div style="font-size:9px;text-transform:uppercase;color:#666;margin-bottom:2px">Ship To</div>
    <div style="font-size:11px;font-weight:bold">${escHtml(order.shippingName)}</div>
    <div style="font-size:10px">${escHtml(order.shippingPhone)}</div>
    <div style="font-size:10px">${escHtml(order.shippingAddress)}</div>
    <div style="font-size:10px">${escHtml([order.shippingArea, order.shippingDistrict, order.shippingDivision].filter(Boolean).join(", "))}</div>
  </div>

  <div style="margin-bottom:5px;padding-bottom:5px;border-bottom:1px dashed #ccc">
    <div style="font-size:9px;text-transform:uppercase;color:#666;margin-bottom:2px">Items</div>
    ${itemsHtml}
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:9px;text-transform:uppercase;color:#666">Payment</div>
      <div style="font-size:10px;font-weight:bold">${escHtml(order.paymentMethod)}</div>
      <div style="font-size:9px;color:#666">${escHtml(order.paymentStatus)}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:9px;text-transform:uppercase;color:#666">Total</div>
      <div style="font-size:13px;font-weight:bold">৳${total}</div>
    </div>
  </div>

  ${noteHtml}
  ${giftHtml}

  <div style="display:flex;align-items:center;gap:5px;margin-top:5px;padding-top:5px;border-top:1px dashed #ccc">
    <img src="${qrUrl}" alt="QR" width="50" height="50" style="flex-shrink:0" />
    <div>
      <div style="font-size:9px;color:#666">Scan to track</div>
      <div style="font-size:9px;font-weight:bold">${escHtml(order.orderNumber)}</div>
    </div>
  </div>
</div>`
  }).join("\n")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Packing Slips — ${orders.length} order${orders.length !== 1 ? "s" : ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 8mm;
      max-width: 210mm;
      margin: 0 auto;
    }
    .slips {
      columns: 2;
      column-gap: 5mm;
    }
    .slip {
      break-inside: avoid;
      border: 1px dashed #999;
      padding: 7px;
      margin-bottom: 5mm;
    }
    #print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 24px;
      background: #000;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
      font-family: sans-serif;
    }
    @media print {
      #print-btn { display: none; }
      body { padding: 5mm; }
    }
  </style>
</head>
<body>
  <div class="slips">
    ${slipsHtml}
  </div>
  <button id="print-btn" onclick="window.print()">Print All (${orders.length})</button>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function escHtml(str: string | null | undefined): string {
  return (str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
