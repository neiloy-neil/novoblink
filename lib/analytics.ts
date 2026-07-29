// Client-side analytics helpers — GA4 + Meta Pixel.
// All functions are no-ops if scripts aren't loaded.

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
  }
}

export function trackViewContent(product: {
  id: string
  name: string
  price: number
  category?: string
  sku?: string
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "view_item", {
    currency: "BDT",
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price, quantity: 1 }],
  })

  window.fbq?.("track", "ViewContent", {
    content_ids: [product.sku || product.id],
    content_type: "product",
    content_name: product.name,
    content_category: product.category || "",
    contents: [{ id: product.sku || product.id, quantity: 1, item_price: product.price }],
    value: product.price,
    currency: "BDT",
  })
}

export function trackAddToCart(item: {
  productId: string
  variantSku?: string
  name: string
  price: number
  quantity: number
  size: string
  color: string
  category?: string
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "add_to_cart", {
    currency: "BDT",
    value: item.price * item.quantity,
    items: [{ item_id: item.productId, item_name: item.name, item_category: item.category, price: item.price, quantity: item.quantity }],
  })

  window.fbq?.("track", "AddToCart", {
    content_ids: [item.variantSku || item.productId],
    content_type: "product",
    content_name: item.name,
    contents: [{ id: item.variantSku || item.productId, quantity: item.quantity, item_price: item.price }],
    value: item.price * item.quantity,
    currency: "BDT",
  })
}

export function trackInitiateCheckout(cart: {
  value: number
  items: { productId: string; variantSku?: string; name: string; price: number; quantity: number }[]
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "begin_checkout", {
    currency: "BDT",
    value: cart.value,
    items: cart.items.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
  })

  window.fbq?.("track", "InitiateCheckout", {
    content_ids: cart.items.map((i) => i.variantSku || i.productId),
    content_type: "product",
    contents: cart.items.map((i) => ({ id: i.variantSku || i.productId, quantity: i.quantity, item_price: i.price })),
    value: cart.value,
    currency: "BDT",
    num_items: cart.items.reduce((s, i) => s + i.quantity, 0),
  })
}

export function trackPurchase(order: {
  id: string
  orderNumber: string
  total: number
  items: { productId: string; variantSku?: string; name: string; price: number; quantity: number }[]
}) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "purchase", {
    transaction_id: order.orderNumber,
    currency: "BDT",
    value: order.total,
    items: order.items.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
  })

  window.fbq?.("track", "Purchase", {
    value: order.total,
    currency: "BDT",
    content_ids: order.items.map((i) => i.variantSku || i.productId),
    content_type: "product",
    contents: order.items.map((i) => ({ id: i.variantSku || i.productId, quantity: i.quantity, item_price: i.price })),
    num_items: order.items.reduce((s, i) => s + i.quantity, 0),
  })
}

export function trackSearch(query: string) {
  if (typeof window === "undefined") return

  window.gtag?.("event", "search", { search_term: query })

  window.fbq?.("track", "Search", {
    search_string: query,
    currency: "BDT",
  })
}

export function trackCompleteRegistration() {
  if (typeof window === "undefined") return

  window.gtag?.("event", "sign_up", { method: "email" })

  window.fbq?.("track", "CompleteRegistration", {
    content_name: "Account Registration",
    status: 1,
    currency: "BDT",
    value: 0,
  })
}
