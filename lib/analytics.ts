// Client-side analytics event helpers — fire GA4 + Meta Pixel simultaneously.
// Both are no-ops if the scripts aren't loaded (IDs not configured).

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
  }
}

export function trackAddToCart(item: {
  productId: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "add_to_cart", {
    currency: "BDT",
    value: item.price * item.quantity,
    items: [{ item_id: item.productId, item_name: item.name, price: item.price, quantity: item.quantity }],
  })

  window.fbq?.("track", "AddToCart", {
    content_ids: [item.productId],
    contents: [{ id: item.productId, quantity: item.quantity }],
    content_name: item.name,
    content_type: "product_group",
    value: item.price * item.quantity,
    currency: "BDT",
  })
}

export function trackInitiateCheckout(value: number, itemCount: number) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "begin_checkout", { currency: "BDT", value })

  window.fbq?.("track", "InitiateCheckout", {
    value,
    currency: "BDT",
    num_items: itemCount,
  })
}

export function trackPurchase(order: {
  id: string
  orderNumber: string
  total: number
  items: { productId: string; name: string; price: number; quantity: number }[]
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "purchase", {
    transaction_id: order.orderNumber,
    currency: "BDT",
    value: order.total,
    items: order.items.map((i) => ({
      item_id: i.productId,
      item_name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  })

  window.fbq?.("track", "Purchase", {
    value: order.total,
    currency: "BDT",
    content_ids: order.items.map((i) => i.productId),
    contents: order.items.map((i) => ({ id: i.productId, quantity: i.quantity })),
    content_type: "product_group",
    num_items: order.items.reduce((s, i) => s + i.quantity, 0),
  })
}

export function trackViewContent(productId: string, name: string, price: number) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "view_item", {
    currency: "BDT",
    value: price,
    items: [{ item_id: productId, item_name: name, price }],
  })

  window.fbq?.("track", "ViewContent", {
    content_ids: [productId],
    contents: [{ id: productId, quantity: 1 }],
    content_name: name,
    content_type: "product_group",
    value: price,
    currency: "BDT",
  })
}
