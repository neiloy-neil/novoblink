"use client"

import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"
import { useWishlistStore } from "@/store/useWishlistStore"
import { useSession } from "@/hooks/useSession"
import { toast } from "sonner"

export default function WishlistPage() {
  const { items, removeItem, loadFromDB } = useWishlistStore()
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) loadFromDB()
  }, [session?.user?.id])

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-in fade-in duration-500">
        <Heart className="w-16 h-16 mx-auto text-novo-border mb-6" />
        <h1 className="text-3xl font-heading font-bold text-novo-black mb-3">Your Wishlist is Empty</h1>
        <p className="text-novo-text-muted mb-8">Save items you love and come back to them anytime.</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-novo-black text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-novo-blue transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 animate-in fade-in duration-500">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-4xl font-heading font-bold text-novo-black">Wishlist</h1>
        <p className="text-sm text-novo-text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="group relative flex flex-col gap-3">
            <div className="relative aspect-[3/4] bg-novo-muted rounded-xl overflow-hidden">
              <Link href={`/shop/${item.slug}`}>
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              <button
                onClick={() => {
                  removeItem(item.id)
                  toast.success("Removed from wishlist")
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-novo-error hover:bg-novo-error hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1 px-1">
              {item.category && (
                <p className="text-[10px] uppercase tracking-widest text-novo-text-muted">{item.category}</p>
              )}
              <Link href={`/shop/${item.slug}`} className="font-medium text-sm line-clamp-1 hover:text-novo-blue transition-colors">
                {item.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-sm">৳{item.price.toLocaleString()}</span>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="font-mono text-xs text-novo-text-muted line-through">
                    ৳{item.comparePrice.toLocaleString()}
                  </span>
                )}
              </div>
              <Link
                href={`/shop/${item.slug}`}
                className="mt-2 w-full py-2.5 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 hover:bg-novo-blue transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> View Product
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
