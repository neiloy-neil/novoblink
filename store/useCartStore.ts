import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackAddToCart } from '@/lib/analytics'

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => {
        // Funnel: add_to_cart event (fire-and-forget)
        fetch("/api/store/funnel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "add_to_cart", productId: item.productId, value: item.price, sessionId: "client" }),
        }).catch(() => {})
        trackAddToCart({ productId: item.productId, name: item.name, price: item.price, quantity: item.quantity, size: item.size, color: item.color })

        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'clothing-cart-storage' }
  )
)
