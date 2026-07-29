"use client"

import { useEffect, useRef } from "react"
import { useCartStore } from "@/store/useCartStore"

// Snapshots the cart to the server after the user is idle for 60 seconds with items in the cart.
// The server stores it so admins can see abandoned carts and trigger recovery emails.
export function useAbandonedCart(email?: string, phone?: string) {
  const items = useCartStore(s => s.items)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!items.length) return

    const sessionId = getOrCreateSessionId()
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      fetch("/api/store/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, email, phone, items, subtotal }),
      }).catch(() => {})
    }, 60_000)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [items, email, phone])
}

function getOrCreateSessionId(): string {
  const key = "drip_cart_session"
  let id = typeof window !== "undefined" ? localStorage.getItem(key) : null
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36)
    if (typeof window !== "undefined") localStorage.setItem(key, id)
  }
  return id
}
