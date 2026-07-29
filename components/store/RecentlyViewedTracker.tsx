"use client"
import { useEffect } from "react"
import { useRecentlyViewed, RecentProduct } from "@/hooks/useRecentlyViewed"
import { trackViewContent } from "@/lib/analytics"

export function RecentlyViewedTracker({ product }: { product: RecentProduct }) {
  const { addItem } = useRecentlyViewed()
  useEffect(() => {
    addItem(product)
    // Fire funnel event
    fetch("/api/store/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "product_view", productId: product.id, value: product.price }),
    }).catch(() => {})
    trackViewContent(product.id, product.name, product.price)
  }, [product.id])
  return null
}
