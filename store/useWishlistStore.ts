import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface WishlistItem {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  image: string
  category?: string
}

interface WishlistStore {
  items: WishlistItem[]
  userId: string | null
  setUserId: (id: string | null) => void
  loadFromDB: () => Promise<void>
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  toggleItem: (item: WishlistItem) => void
  isWishlisted: (id: string) => boolean
  clear: () => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,

      setUserId: (id) => set({ userId: id }),

      loadFromDB: async () => {
        try {
          const res = await fetch("/api/user/wishlist")
          if (!res.ok) return
          const { items } = await res.json()
          set({ items })
        } catch {
          // keep local state on failure
        }
      },

      addItem: (item) => {
        if (!get().isWishlisted(item.id)) {
          set((s) => ({ items: [...s.items, item] }))
          if (get().userId) {
            fetch("/api/user/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: item.id }),
            }).catch(() => {})
          }
        }
      },

      removeItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
        if (get().userId) {
          fetch("/api/user/wishlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          }).catch(() => {})
        }
      },

      toggleItem: (item) => {
        if (get().isWishlisted(item.id)) {
          get().removeItem(item.id)
        } else {
          get().addItem(item)
        }
      },

      isWishlisted: (id) => get().items.some((i) => i.id === id),

      clear: () => set({ items: [], userId: null }),
    }),
    {
      name: "NovoBlink-wishlist",
      // don't persist userId — re-set on each session mount
      partialize: (s) => ({ items: s.items }),
    }
  )
)
