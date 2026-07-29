"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"

interface FBTProduct {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  image?: string
}

export default function FrequentlyBoughtTogether({ productId }: { productId: string }) {
  const [products, setProducts] = useState<FBTProduct[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/fbt`)
      .then(r => r.json())
      .then(data => {
        const items = data.items || []
        setProducts(items)
        setSelected(new Set(items.map((p: FBTProduct) => p.id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [productId])

  if (loading || products.length === 0) return null

  const total = products
    .filter(p => selected.has(p.id))
    .reduce((sum, p) => sum + p.price, 0)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const addSelected = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    for (const id of ids) {
      await fetch("/api/store/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      }).catch(() => {})
    }
    toast.success(`${ids.length} item${ids.length === 1 ? "" : "s"} added to cart`)
  }

  return (
    <div className="mt-16 border-t border-novo-border pt-12">
      <h2 className="text-xl font-heading font-bold text-novo-black mb-6">Frequently Bought Together</h2>
      <div className="flex flex-wrap gap-4 items-start">
        {products.map((product, i) => (
          <div key={product.id} className="flex items-center gap-3">
            {i > 0 && <span className="text-novo-text-muted font-bold text-xl">+</span>}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="relative w-24 h-32 rounded overflow-hidden border border-novo-border bg-novo-muted">
                  {product.image && (
                    <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggle(product.id)}
                  className="absolute top-1 left-1 w-4 h-4 accent-novo-black"
                />
              </div>
              <Link href={`/shop/${product.slug}`} className="text-xs text-novo-text hover:text-novo-blue transition-colors text-center w-24 line-clamp-2">
                {product.name}
              </Link>
              <span className="text-xs font-mono font-bold">৳{product.price.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4">
        <div className="text-sm">
          Total: <span className="font-bold font-mono">৳{total.toLocaleString()}</span>
          <span className="text-novo-text-muted ml-1">for {selected.size} item{selected.size === 1 ? "" : "s"}</span>
        </div>
        <button
          onClick={addSelected}
          disabled={selected.size === 0}
          className="px-5 py-2 bg-novo-black text-white text-sm font-medium rounded hover:bg-novo-blue transition-colors disabled:opacity-50"
        >
          Add Selected to Cart
        </button>
      </div>
    </div>
  )
}
