"use client"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"
import Link from "next/link"
import Image from "next/image"

export function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const { items } = useRecentlyViewed()
  const filtered = items.filter(p => p.id !== currentProductId)
  if (filtered.length === 0) return null

  return (
    <div className="mt-16">
      <h2 className="text-xl font-heading font-bold text-novo-black mb-6">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {filtered.map(product => (
          <Link key={product.id} href={`/shop/${product.slug}`} className="shrink-0 w-40 group">
            <div className="relative aspect-[3/4] w-full bg-novo-muted overflow-hidden rounded-sm mb-2">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill sizes="160px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full bg-novo-muted" />
              )}
            </div>
            <p className="text-xs font-medium text-novo-text line-clamp-2 leading-snug">{product.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-mono text-novo-black">৳{product.price.toLocaleString()}</span>
              {product.comparePrice && (
                <span className="text-xs font-mono text-novo-text-muted line-through">৳{product.comparePrice.toLocaleString()}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
