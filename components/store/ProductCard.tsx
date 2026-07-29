"use client"
import Link from "next/link"
import { Heart, ShoppingBag, Star } from "lucide-react"
import { useWishlistStore } from "@/store/useWishlistStore"
import { toast } from "sonner"

export default function ProductCard({
  product,
  flashSalePrice,
  flashSaleLabel,
  avgRating,
  reviewCount,
}: {
  product: any
  flashSalePrice?: number
  flashSaleLabel?: string
  avgRating?: number | null
  reviewCount?: number | null
}) {
  const { toggleItem, isWishlisted } = useWishlistStore()
  const wishlisted = isWishlisted(product.id)

  const images = product.images || []
  const firstImage = images[0] || {}
  const thumbnail = firstImage.url || "/placeholder.jpg"
  const hoverImage = images[1]?.url || thumbnail
  const hoverVideo = firstImage.isVideo ? firstImage.videoUrl : (images[1]?.isVideo ? images[1]?.videoUrl : null)

  const isNew = (Date.now() - new Date(product.createdAt).getTime()) < 1000 * 60 * 60 * 24 * 7
  const hasSale = !!product.comparePrice || !!flashSalePrice
  const hasFlashSale = !!flashSalePrice
  const displayPrice = flashSalePrice ?? Number(product.price)
  const isLowStock = product.variants?.reduce((acc: number, v: any) => acc + v.stock, 0) < 5
  const discountPercent = product.comparePrice
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : flashSalePrice
    ? Math.round(((Number(product.price) - flashSalePrice) / Number(product.price)) * 100)
    : 0
  const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size) || ["S", "M", "L"]))

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      image: thumbnail,
      category: product.category?.name,
    })
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist")
  }

  return (
    <div className="group relative flex flex-col gap-3">
      {/* Image Box */}
      <div className="relative aspect-[3/4] bg-novo-muted rounded-xl overflow-hidden cursor-pointer">
        <Link href={`/shop/${product.slug}`} className="absolute inset-0">
          <img
            src={thumbnail}
            alt={product.name}
            className="absolute inset-0 object-cover w-full h-full transition-opacity duration-500 group-hover:opacity-0"
          />
          {hoverVideo ? (
            <video
              src={hoverVideo}
              autoPlay muted loop playsInline
              className="absolute inset-0 object-cover w-full h-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          ) : (
            <img
              src={hoverImage}
              alt={product.name}
              className="absolute inset-0 object-cover w-full h-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {isNew && <span className="bg-novo-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">New</span>}
          {hasFlashSale && <span className="bg-novo-error text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">⚡ {flashSaleLabel}</span>}
          {!hasFlashSale && hasSale && <span className="bg-novo-blue text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Sale</span>}
          {isLowStock && <span className="bg-novo-error text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">Low Stock</span>}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ${
            wishlisted
              ? "bg-novo-error text-white opacity-100 translate-y-0"
              : "bg-white/50 text-novo-text-muted hover:bg-novo-error hover:text-white"
          }`}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
        </button>

        {/* Quick Add (Desktop) */}
        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <Link href={`/shop/${product.slug}`}>
            <button className="w-full bg-white/90 backdrop-blur-sm text-novo-black font-medium py-2.5 rounded-full flex items-center justify-center gap-2 hover:bg-novo-blue hover:text-white transition-colors text-sm shadow-sm">
              <ShoppingBag className="w-4 h-4" /> Quick Add
            </button>
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] uppercase tracking-widest text-novo-text-muted">{product.category?.name}</p>
        <Link href={`/shop/${product.slug}`} className="font-medium text-sm line-clamp-1 group-hover:text-novo-blue transition-colors">
          {product.name}
        </Link>
        {reviewCount != null && reviewCount > 0 && avgRating != null && (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={`w-3 h-3 ${n <= Math.round(avgRating) ? "fill-novo-blue text-novo-blue" : "text-novo-border"}`} />
              ))}
            </div>
            <span className="text-[10px] text-novo-text-muted">({reviewCount})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`font-mono font-medium text-sm ${hasFlashSale ? "text-novo-error" : ""}`}>
            ৳{displayPrice.toLocaleString()}
          </span>
          {(hasSale || hasFlashSale) && (
            <>
              <span className="font-mono text-xs text-novo-text-muted line-through">
                ৳{hasFlashSale ? Number(product.price).toLocaleString() : Number(product.comparePrice).toLocaleString()}
              </span>
              <span className="text-[10px] text-novo-success font-bold bg-novo-success/10 px-1.5 py-0.5 rounded">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {(sizes as string[]).map((size, i) => (
            <span key={i} className="text-[10px] border border-novo-border text-novo-text-muted px-1.5 py-0.5 rounded-full">
              {size}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
