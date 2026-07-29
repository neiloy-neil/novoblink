"use client"

import { useWishlistStore } from "@/store/useWishlistStore"
import { useCartStore } from "@/store/useCartStore"
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-full bg-novo-muted flex items-center justify-center text-novo-border mb-8">
          <Heart className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-4">Your Wishlist is Empty</h1>
        <p className="text-novo-text-muted max-w-md mb-8">
          Save items you love by tapping the heart icon on any product.
        </p>
        <Link href="/shop">
          <button className="px-8 py-4 bg-novo-black text-white font-bold uppercase tracking-widest rounded-full hover:bg-novo-blue hover:shadow-lg hover:shadow-novo-blue/20 transition-all duration-300">
            Browse Products
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 animate-in fade-in duration-500">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-novo-black mb-1">Wishlist</h1>
          <p className="text-sm text-novo-text-muted uppercase tracking-widest font-medium">{items.length} saved items</p>
        </div>
        <Link href="/shop" className="text-sm font-medium underline underline-offset-4 hover:text-novo-blue transition-colors hidden md:block">
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const hasSale = !!item.comparePrice
          const discount = hasSale
            ? Math.round(((Number(item.comparePrice) - Number(item.price)) / Number(item.comparePrice)) * 100)
            : 0

          return (
            <div key={item.id} className="group flex flex-col gap-3">
              <div className="relative aspect-[3/4] bg-novo-muted rounded-xl overflow-hidden">
                <Link href={`/shop/${item.slug}`}>
                  <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                <button
                  onClick={() => { removeItem(item.id); toast.success("Removed from wishlist") }}
                  className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 rounded-full text-novo-error hover:bg-novo-error hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="px-1 space-y-1">
                {item.category && <p className="text-[10px] uppercase tracking-widest text-novo-text-muted">{item.category}</p>}
                <Link href={`/shop/${item.slug}`} className="font-medium text-sm line-clamp-1 hover:text-novo-blue transition-colors">
                  {item.name}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">৳{Number(item.price).toLocaleString()}</span>
                  {hasSale && (
                    <>
                      <span className="font-mono text-xs text-novo-text-muted line-through">৳{Number(item.comparePrice).toLocaleString()}</span>
                      <span className="text-[10px] text-novo-success font-bold bg-novo-success/10 px-1.5 py-0.5 rounded">-{discount}%</span>
                    </>
                  )}
                </div>
              </div>

              <Link href={`/shop/${item.slug}`} className="mx-1">
                <button className="w-full py-2.5 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 hover:bg-novo-blue transition-colors duration-300">
                  <ShoppingBag className="w-3.5 h-3.5" /> View & Add to Bag
                </button>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
