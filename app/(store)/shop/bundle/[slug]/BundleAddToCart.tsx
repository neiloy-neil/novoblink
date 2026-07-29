"use client"

import { useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import { toast } from "sonner"
import { ShoppingBag } from "lucide-react"

type BundleItem = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string }[]
    variants: { id: string; size: string; color: string; stock: number }[]
  }
}

type Bundle = {
  id: string
  name: string
  price: number
  type: string
  minItems: number | null
  maxItems: number | null
  discountPct: number | null
  items: BundleItem[]
}

export default function BundleAddToCart({ bundle }: { bundle: Bundle }) {
  const addItem = useCartStore(s => s.addItem)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  function selectVariant(productId: string, variantId: string) {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }))
  }

  function addBundleToCart() {
    const allSelected = bundle.items.every(item => selectedVariants[item.product.id])
    if (!allSelected) {
      toast.error("Please select a size/color for each item in the bundle")
      return
    }

    bundle.items.forEach(item => {
      const variantId = selectedVariants[item.product.id]
      const variant = item.product.variants.find(v => v.id === variantId)
      if (!variant) return

      addItem({
        id: variant.id,
        variantId: variant.id,
        productId: item.product.id,
        productSlug: item.product.slug,
        name: item.product.name,
        price: Number(bundle.price) / bundle.items.length,
        size: variant.size,
        color: variant.color,
        image: item.product.images[0]?.url || "",
        quantity: item.quantity,
      })
    })

    toast.success(`${bundle.name} added to bag!`)
  }

  return (
    <div className="space-y-4">
      {bundle.items.map(item => {
        const variants = item.product.variants.filter(v => v.stock > 0)
        return (
          <div key={item.id} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted">{item.product.name}</p>
            <div className="flex flex-wrap gap-2">
              {variants.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVariant(item.product.id, v.id)}
                  className={`px-3 py-1.5 text-xs border rounded transition-all ${selectedVariants[item.product.id] === v.id ? "bg-novo-black text-white border-novo-black" : "border-novo-border hover:border-novo-black"}`}
                >
                  {v.size} / {v.color}
                </button>
              ))}
              {variants.length === 0 && <p className="text-xs text-novo-error">Out of stock</p>}
            </div>
          </div>
        )
      })}

      <button
        onClick={addBundleToCart}
        className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-novo-blue transition-colors rounded-full text-sm mt-2"
      >
        <ShoppingBag className="w-4 h-4" /> Add Bundle to Bag
      </button>
    </div>
  )
}
