"use client"
import { useEffect, useState } from "react"

const MAX = 8
const KEY = "drip_recently_viewed"

export type RecentProduct = { id: string; slug: string; name: string; image: string; price: number; comparePrice?: number }

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentProduct[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  function addItem(product: RecentProduct) {
    setItems(prev => {
      const filtered = prev.filter(p => p.id !== product.id)
      const next = [product, ...filtered].slice(0, MAX)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { items, addItem }
}
