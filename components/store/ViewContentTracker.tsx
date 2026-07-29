"use client"

import { useEffect } from "react"
import { trackViewContent } from "@/lib/analytics"

export default function ViewContentTracker({ product }: {
  product: { id: string; name: string; price: number; category?: string; sku?: string }
}) {
  useEffect(() => {
    trackViewContent(product)
  }, [product.id])

  return null
}
