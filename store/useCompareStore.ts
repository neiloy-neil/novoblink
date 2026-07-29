import { create } from "zustand"
import { persist } from "zustand/middleware"

export type CompareProduct = {
  id: string
  name: string
  slug: string
  image?: string
  price: number
  comparePrice?: number
  category?: string
  brand?: string
  tags?: string
}

type CompareStore = {
  items: CompareProduct[]
  addItem: (product: CompareProduct) => void
  removeItem: (id: string) => void
  toggleItem: (product: CompareProduct) => void
  hasItem: (id: string) => boolean
  clearAll: () => void
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        if (get().items.length >= 4) return // max 4 comparisons
        if (!get().hasItem(product.id)) {
          set(s => ({ items: [...s.items, product] }))
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      toggleItem: (product) => {
        if (get().hasItem(product.id)) {
          get().removeItem(product.id)
        } else {
          get().addItem(product)
        }
      },
      hasItem: (id) => get().items.some(i => i.id === id),
      clearAll: () => set({ items: [] }),
    }),
    { name: "NovoBlink-compare" }
  )
)
