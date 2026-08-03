import nodemailer from "nodemailer"
import prisma from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Transport factory — reads SMTP config from Setting table at call time.
// Falls back to Resend SMTP relay if no custom SMTP configured.
// ---------------------------------------------------------------------------

async function getSmtpConfig() {
  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email"]
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return s
}

async function createTransport() {
  const s = await getSmtpConfig()

  if (s.smtp_host && s.smtp_user && s.smtp_pass) {
    return nodemailer.createTransport({
      host: s.smtp_host,
      port: Number(s.smtp_port || 587),
      secure: s.smtp_secure === "true",
      auth: { user: s.smtp_user, pass: s.smtp_pass },
    })
  }

  // No SMTP configured — log warning and use no-op transport
  console.warn("[email] No SMTP configured. Emails will not be sent. Configure smtp_host/smtp_user/smtp_pass in Admin → Settings.")
  return nodemailer.createTransport({ jsonTransport: true })
}

async function getSenderAddress() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["smtp_from_name", "smtp_from_email", "store_name", "support_email"] } },
  })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const name = s.smtp_from_name || s.store_name || "NovoBlink"
  const email = s.smtp_from_email || s.support_email || process.env.FROM_EMAIL || "noreply@novoblink.com.bd"
  return `${name} <${email}>`
}

async function sendMail(to: string, subject: string, html: string) {
  const transport = await createTransport()
  const from = await getSenderAddress()
  await transport.sendMail({ from, to, subject, html })
}

// ---------------------------------------------------------------------------
// Store metadata (name / logo / url) for email templates
// ---------------------------------------------------------------------------

async function getStoreMeta() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["store_name", "store_logo", "support_email", "store_url"] } },
  })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  return {
    name: map.store_name || "NovoBlink",
    logo: map.store_logo || "",
    email: map.support_email || process.env.FROM_EMAIL || "noreply@novoblink.com.bd",
    url: map.store_url || process.env.NEXT_PUBLIC_SITE_URL || "https://novoblink.com.bd",
  }
}

// ---------------------------------------------------------------------------
// Base HTML template
// ---------------------------------------------------------------------------

function baseTemplate(store: { name: string; logo: string; url: string }, content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f0;color:#1a1a1a;font-size:15px;line-height:1.6}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e0}
.header{background:#1a1a1a;padding:28px 32px;text-align:center}
.header-name{color:#fff;font-size:22px;font-weight:700;letter-spacing:4px;text-transform:uppercase}
.body{padding:32px}
.footer{padding:20px 32px;text-align:center;font-size:12px;color:#888;border-top:1px solid #f0f0e8;background:#fafaf8}
.btn{display:inline-block;background:#1a1a1a;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.5px;margin:20px 0}
.divider{border:none;border-top:1px solid #f0f0e8;margin:24px 0}
.muted{color:#666;font-size:13px}
.label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px}
.value{font-size:15px;font-weight:500;color:#1a1a1a}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
.item-row{display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f5f5f0}
.item-row:last-child{border-bottom:none}
.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#666}
.total-final{display:flex;justify-content:space-between;padding:12px 0;font-size:17px;font-weight:700;border-top:2px solid #1a1a1a;margin-top:8px}
.tag{display:inline-block;background:#f0f0e8;color:#555;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:500}
.tag-gold{background:#faf3d8;color:#7a5c00}
.tag-green{background:#eaf3de;color:#3b6d11}
.tag-red{background:#fcebeb;color:#a32d2d}
.alert{background:#faf3d8;border:1px solid #e8d88a;border-radius:8px;padding:16px;margin:20px 0;font-size:14px}
</style></head><body>
<div class="wrap">
<div class="header">
  ${store.logo ? `<img src="${store.logo}" alt="${store.name}" style="height:36px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto">` : ""}
  <div class="header-name">${store.name}</div>
</div>
<div class="body">${content}</div>
<div class="footer">
  <p>&copy; ${new Date().getFullYear()} ${store.name} &nbsp;·&nbsp; <a href="${store.url}" style="color:#888">${store.url}</a></p>
  <p style="margin-top:6px">Questions? Reply to this email or contact support.</p>
</div>
</div>
</body></html>`
}

// ---------------------------------------------------------------------------
// Email send functions
// ---------------------------------------------------------------------------

type OrderEmailData = {
  to: string
  orderId: string
  orderNumber: string
  customerName: string
  items: { productName: string; size: string; color: string; quantity: number; price: number }[]
  subtotal: number
  shippingCharge: number
  discount: number
  giftWrapCharge: number
  total: number
  paymentMethod: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingArea: string
  shippingDistrict: string
  shippingDivision: string
  note?: string | null
  giftWrap?: boolean
  giftMessage?: string | null
}

// Generic email sender — used for campaigns and other custom emails
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transport = await createTransport()
  const store = await getStoreMeta()
  await transport.sendMail({
    from: `"${store.name}" <${store.email}>`,
    to,
    subject,
    html,
  })
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const store = await getStoreMeta()
  const itemRows = data.items.map((i) => `
    <div class="item-row">
      <div>
        <div style="font-weight:500">${i.productName}</div>
        <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
      </div>
      <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
    </div>`).join("")

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order confirmed!</h1>
    <p class="muted">Hi ${data.customerName}, your order has been placed and is being processed.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Order number</div><div class="value">${data.orderNumber}</div></div>
      <div><div class="label">Payment method</div><div class="value">${data.paymentMethod}</div></div>
    </div>
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Items ordered</h3>
    ${itemRows}
    <div style="margin-top:16px">
      <div class="total-row"><span>Subtotal</span><span>৳${data.subtotal.toLocaleString()}</span></div>
      ${data.shippingCharge > 0 ? `<div class="total-row"><span>Shipping</span><span>৳${data.shippingCharge.toLocaleString()}</span></div>` : `<div class="total-row"><span>Shipping</span><span class="tag tag-green">Free</span></div>`}
      ${data.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#3b6d11">−৳${data.discount.toLocaleString()}</span></div>` : ""}
      ${data.giftWrapCharge > 0 ? `<div class="total-row"><span>Gift wrap</span><span>৳${data.giftWrapCharge.toLocaleString()}</span></div>` : ""}
      <div class="total-final"><span>Total</span><span>৳${data.total.toLocaleString()}</span></div>
    </div>
    <hr class="divider">
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:12px">Shipping to</h3>
    <p style="font-weight:500">${data.shippingName}</p>
    <p class="muted">${data.shippingPhone}</p>
    <p class="muted">${data.shippingAddress}, ${data.shippingArea}</p>
    <p class="muted">${data.shippingDistrict}, ${data.shippingDivision}</p>
    ${data.note ? `<div class="alert" style="margin-top:20px"><strong>Your note:</strong> ${data.note}</div>` : ""}
    ${data.giftWrap ? `<div class="alert" style="margin-top:16px">🎁 <strong>Gift wrapped</strong>${data.giftMessage ? ` — "${data.giftMessage}"` : ""}</div>` : ""}
    <a href="${store.url}/order/${data.orderId}" class="btn">Track your order →</a>`

  await sendMail(data.to, `Order confirmed — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendShippingDispatched(data: {
  to: string
  customerName: string
  orderNumber: string
  courierName: string
  trackingNumber: string
  trackingUrl?: string
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Your order is on the way!</h1>
    <p class="muted">Hi ${data.customerName}, <strong>${data.orderNumber}</strong> has been dispatched.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Courier</div><div class="value">${data.courierName}</div></div>
      <div><div class="label">Tracking number</div><div class="value" style="font-family:monospace">${data.trackingNumber}</div></div>
    </div>
    ${data.trackingUrl ? `<a href="${data.trackingUrl}" class="btn">Track shipment →</a>` : `<a href="${store.url}/account/orders" class="btn">View order →</a>`}
    <p class="muted" style="margin-top:16px">Delivery typically takes 1–3 business days after dispatch.</p>`

  await sendMail(data.to, `Dispatched — ${data.orderNumber} is on the way!`, baseTemplate(store, content))
}

export async function sendOrderStatusUpdate(data: {
  to: string
  customerName: string
  orderNumber: string
  status: string
  note?: string | null
}) {
  const store = await getStoreMeta()
  const statusLabel: Record<string, string> = {
    CONFIRMED: "Order confirmed",
    PROCESSING: "Being processed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    RETURNED: "Return processed",
  }
  const label = statusLabel[data.status] || data.status
  const isNegative = data.status === "CANCELLED"
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Order update</h1>
    <p class="muted">Hi ${data.customerName}, here's an update on <strong>${data.orderNumber}</strong>.</p>
    <hr class="divider">
    <div style="margin:20px 0">
      <div class="label">New status</div>
      <span class="tag ${isNegative ? "tag-red" : "tag-green"}" style="font-size:14px;padding:6px 16px;margin-top:6px;display:inline-block">${label}</span>
    </div>
    ${data.note ? `<div class="alert">${data.note}</div>` : ""}
    <a href="${store.url}/account/orders" class="btn">View order →</a>`

  await sendMail(data.to, `${label} — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendReturnUpdate(data: {
  to: string
  customerName: string
  orderNumber: string
  status: string
  refundAmount?: number
  adminNote?: string | null
}) {
  const store = await getStoreMeta()
  const isApproved = data.status === "APPROVED" || data.status === "REFUNDED"
  const isRejected = data.status === "REJECTED"
  const label = { APPROVED: "Return approved", REJECTED: "Return rejected", REFUNDED: "Refund processed", RECEIVED: "Return received" }[data.status] || data.status

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Return request update</h1>
    <p class="muted">Hi ${data.customerName}, your return request for <strong>${data.orderNumber}</strong> has been updated.</p>
    <hr class="divider">
    <div style="margin:20px 0">
      <span class="tag ${isApproved ? "tag-green" : isRejected ? "tag-red" : "tag-gold"}" style="font-size:14px;padding:6px 16px;display:inline-block">${label}</span>
    </div>
    ${data.refundAmount && data.refundAmount > 0 ? `<p><strong>Refund amount:</strong> ৳${data.refundAmount.toLocaleString()}</p>` : ""}
    ${data.adminNote ? `<div class="alert">${data.adminNote}</div>` : ""}
    <a href="${store.url}/account/orders" class="btn">View order →</a>`

  await sendMail(data.to, `${label} — ${data.orderNumber}`, baseTemplate(store, content))
}

export async function sendGiftCardEmail(data: {
  to: string
  recipientName: string
  senderName: string
  code: string
  amount: number
  message?: string | null
  expiresAt?: Date | null
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">You've received a gift card!</h1>
    <p class="muted"><strong>${data.senderName}</strong> sent you a ${store.name} gift card.</p>
    ${data.message ? `<div class="alert" style="margin:20px 0;font-style:italic">"${data.message}"</div>` : "<hr class='divider'>"}
    <div style="background:#f5f5f0;border-radius:12px;padding:28px;text-align:center;margin:20px 0">
      <div class="label" style="text-align:center">Gift card value</div>
      <div style="font-size:40px;font-weight:700;margin:8px 0">৳${data.amount.toLocaleString()}</div>
      <div class="label" style="text-align:center;margin-top:16px">Redemption code</div>
      <div style="font-size:24px;font-weight:700;font-family:monospace;letter-spacing:3px;margin-top:4px;background:#fff;border:2px dashed #ccc;border-radius:8px;padding:12px 24px;display:inline-block">${data.code}</div>
    </div>
    ${data.expiresAt ? `<p class="muted" style="text-align:center">Valid until ${new Date(data.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
    <a href="${store.url}" class="btn" style="display:block;text-align:center">Start shopping →</a>`

  await sendMail(data.to, `${data.senderName} sent you a ৳${data.amount.toLocaleString()} ${store.name} gift card`, baseTemplate(store, content))
}

export async function sendAdminNewOrder(data: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: { productName: string; size: string; color: string; quantity: number; price: number }[]
  subtotal: number
  shippingCharge: number
  discount: number
  total: number
  paymentMethod: string
  shippingAddress: string
  shippingArea: string
  shippingDistrict: string
  shippingDivision: string
}) {
  const store = await getStoreMeta()
  const rows = await prisma.setting.findMany({ where: { key: { in: ["admin_notification_email", "support_email"] } } })
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const adminEmail = s.admin_notification_email || s.support_email
  if (!adminEmail) return

  const itemRows = data.items.map((i) => `
    <div class="item-row">
      <div>
        <div style="font-weight:500">${i.productName}</div>
        <div class="muted">${i.size} / ${i.color} &nbsp;×${i.quantity}</div>
      </div>
      <div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div>
    </div>`).join("")

  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">New order received</h1>
    <p class="muted">A new order just landed in your store.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Order number</div><div class="value">${data.orderNumber}</div></div>
      <div><div class="label">Payment</div><div class="value">${data.paymentMethod}</div></div>
    </div>
    <div class="grid-2" style="margin-top:0">
      <div><div class="label">Customer</div><div class="value">${data.customerName}</div></div>
      <div><div class="label">Phone</div><div class="value">${data.customerPhone}</div></div>
    </div>
    ${data.customerEmail ? `<p class="muted" style="margin-top:4px">${data.customerEmail}</p>` : ""}
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin:20px 0 12px">Items</h3>
    ${itemRows}
    <div style="margin-top:16px">
      <div class="total-row"><span>Subtotal</span><span>৳${data.subtotal.toLocaleString()}</span></div>
      ${data.shippingCharge > 0 ? `<div class="total-row"><span>Shipping</span><span>৳${data.shippingCharge.toLocaleString()}</span></div>` : `<div class="total-row"><span>Shipping</span><span style="color:#3b6d11">Free</span></div>`}
      ${data.discount > 0 ? `<div class="total-row"><span>Discount</span><span style="color:#3b6d11">−৳${data.discount.toLocaleString()}</span></div>` : ""}
      <div class="total-final"><span>Total</span><span>৳${data.total.toLocaleString()}</span></div>
    </div>
    <hr class="divider">
    <h3 style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px">Ship to</h3>
    <p class="muted">${data.shippingAddress}, ${data.shippingArea}, ${data.shippingDistrict}, ${data.shippingDivision}</p>
    <a href="${store.url}/admin/orders" class="btn">View in admin →</a>`

  await sendMail(adminEmail, `New order — ${data.orderNumber} (৳${data.total.toLocaleString()})`, baseTemplate(store, content))
}

export async function sendWelcomeEmail(data: { to: string; name: string }) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Welcome to ${store.name}</h1>
    <p class="muted">Hi ${data.name}, your account is ready.</p>
    <hr class="divider">
    <p>Explore the latest drops, save your favourites, and track your orders — all from one place.</p>
    <a href="${store.url}/shop" class="btn">Start shopping →</a>`

  await sendMail(data.to, `Welcome to ${store.name}`, baseTemplate(store, content))
}

export async function sendStoreCreditIssued(data: {
  to: string
  customerName: string
  amount: number
  reason: string
  balance: number
}) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">Store credit added!</h1>
    <p class="muted">Hi ${data.customerName}, you've received store credit.</p>
    <hr class="divider">
    <div class="grid-2">
      <div><div class="label">Amount added</div><div class="value tag-green" style="font-size:18px;font-weight:700;color:#3b6d11">+৳${data.amount.toLocaleString()}</div></div>
      <div><div class="label">New balance</div><div class="value" style="font-size:18px;font-weight:700">৳${data.balance.toLocaleString()}</div></div>
    </div>
    ${data.reason ? `<p class="muted" style="margin-top:12px">Reason: ${data.reason}</p>` : ""}
    <a href="${store.url}/shop" class="btn">Use your credit →</a>`

  await sendMail(data.to, `৳${data.amount.toLocaleString()} store credit added to your account`, baseTemplate(store, content))
}

export async function sendAbandonedCartEmail({
  to, customerName, items, subtotal, sequence, couponCode,
}: {
  to: string
  customerName?: string | null
  items: { name: string; size?: string; color?: string; quantity: number; price: number }[]
  subtotal: number
  sequence: 1 | 2 | 3
  couponCode?: string | null
}) {
  const store = await getStoreMeta()
  const greeting = customerName ? `Hi ${customerName.split(" ")[0]},` : "Hey there,"
  const headlines: Record<number, string> = {
    1: "You left something behind",
    2: "Your cart is still waiting",
    3: "Last chance — your cart expires soon",
  }
  const sublines: Record<number, string> = {
    1: "You started shopping but didn't finish. Your items are still saved.",
    2: "Just a reminder — your bag is packed and ready. Complete your order before it sells out.",
    3: "This is your final reminder. Items in your cart may sell out soon.",
  }
  const itemRows = items.slice(0, 3).map(i =>
    `<div class="item-row"><div><div style="font-weight:500">${i.name}</div><div class="muted">${[i.size, i.color].filter(Boolean).join(" / ")} ×${i.quantity}</div></div><div style="font-weight:500;white-space:nowrap">৳${(i.price * i.quantity).toLocaleString()}</div></div>`
  ).join("")
  const couponBlock = couponCode
    ? `<div class="alert"><strong>Use code <span style="font-family:monospace;font-size:15px">${couponCode}</span> for an extra discount</strong> when you complete your order.</div>`
    : ""
  const content = `
    <h1 style="font-size:22px;font-weight:700;margin-bottom:6px">${headlines[sequence]}</h1>
    <p class="muted">${greeting} ${sublines[sequence]}</p>
    <hr class="divider">
    ${itemRows}
    <div style="margin-top:16px" class="total-final"><span>Subtotal</span><span>৳${subtotal.toLocaleString()}</span></div>
    ${couponBlock}
    <a href="${store.url}/cart" class="btn">Complete your purchase →</a>`
  const subjects: Record<number, string> = {
    1: `You left something in your cart`,
    2: `Your cart is still waiting for you`,
    3: `Last chance — complete your order`,
  }
  await sendMail(to, subjects[sequence], baseTemplate(store, content))
}

export async function sendBackInStockAlert({ to, productName, variantLabel, productUrl }: { to: string; productName: string; variantLabel: string; productUrl: string }) {
  const store = await getStoreMeta()
  const content = `
    <h1 style="font-size:20px;font-weight:700;margin-bottom:6px">Good news — it's back!</h1>
    <p class="muted">You asked us to let you know when <strong>${productName}</strong> (${variantLabel}) was back in stock. It's available now — grab it before it sells out again.</p>
    <hr class="divider">
    <a href="${productUrl}" class="btn">Shop now →</a>`
  await sendMail(to, `${productName} is back in stock!`, baseTemplate(store, content))
}

export async function sendLowStockAlert(variants: { productName: string; size: string; color: string; stock: number; sku?: string | null }[]) {
  const store = await getStoreMeta()
  // Use dedicated admin notification email if configured, fall back to support email
  const settingRows = await prisma.setting.findMany({ where: { key: { in: ["admin_notification_email"] } } })
  const settingMap = Object.fromEntries(settingRows.map(r => [r.key, r.value]))
  const adminEmail = settingMap.admin_notification_email || store.email
  const rows = variants.map(v =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f0f0e8">${v.productName}</td><td style="padding:8px;border-bottom:1px solid #f0f0e8">${v.size} / ${v.color}</td><td style="padding:8px;border-bottom:1px solid #f0f0e8;font-family:monospace">${v.sku || "-"}</td><td style="padding:8px;border-bottom:1px solid #f0f0e8;font-weight:700;color:${v.stock === 0 ? "#a32d2d" : "#7a5c00"}">${v.stock === 0 ? "OUT OF STOCK" : `${v.stock} left`}</td></tr>`
  ).join("")
  const content = `
    <h1 style="font-size:20px;font-weight:700;margin-bottom:6px">⚠️ Low Stock Alert</h1>
    <p class="muted">${variants.length} variant${variants.length !== 1 ? "s" : ""} need restocking.</p>
    <hr class="divider">
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f5f5f0">
        <th style="padding:8px;text-align:left">Product</th>
        <th style="padding:8px;text-align:left">Variant</th>
        <th style="padding:8px;text-align:left">SKU</th>
        <th style="padding:8px;text-align:left">Stock</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${store.url}/admin/inventory" class="btn">View Inventory →</a>`
  await sendMail(adminEmail, `[${store.name}] Low stock alert — ${variants.length} variant${variants.length !== 1 ? "s" : ""}`, baseTemplate(store, content))
}

