"use client"

import { useEffect } from "react"
import { trackPurchase } from "@/lib/analytics"

export default function PurchaseTracker({ order }: {
  order: {
    id: string
    orderNumber: string
    total: number
    items: { productId: string; name: string; price: number; quantity: number }[]
  }
}) {
  useEffect(() => {
    // Only fire once — guard with sessionStorage so refresh doesn't double-fire
    const key = `purchase_tracked_${order.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    trackPurchase(order)
  }, [order.id])

  return null
}
