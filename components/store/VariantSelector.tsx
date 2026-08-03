"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { useCartStore } from "@/store/useCartStore"
import { trackAddToCart } from "@/lib/analytics"
import NotifyMeForm from "@/components/store/NotifyMeForm"

export default function VariantSelector({
  product,
  attr1Label = "Size",
  attr2Label = "Color",
  categoryId,
  basePrice,
  comparePrice,
  flashSale,
}: {
  product: any
  attr1Label?: string
  attr2Label?: string
  categoryId?: string
  basePrice: number
  comparePrice?: number | null
  flashSale?: any | null
}) {
  const variants = product.variants || []
  const addItem = useCartStore((s) => s.addItem)

  const rawSizes = Array.from(new Set(variants.map((v: any) => v.size))) as string[]
  // Sort by leading number so "1pcs < 2pcs Combo < 4pcs Combo" etc.
  const sizes = rawSizes.sort((a: string, b: string) => {
    const numA = parseInt(a) || 0
    const numB = parseInt(b) || 0
    return numA !== numB ? numA - numB : a.localeCompare(b)
  })
  const colors = Array.from(new Set(variants.map((v: any) => v.color))) as string[]

  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] || null)
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] || null)

  const activeVariant = useMemo(() => {
    return variants.find((v: any) => v.size === selectedSize && v.color === selectedColor)
  }, [selectedSize, selectedColor, variants])

  const stock = activeVariant?.stock || 0
  const isOutOfStock = stock === 0

  // Compute price that updates with variant selection
  const variantBasePrice = activeVariant ? Number(activeVariant.price ?? basePrice) : basePrice
  const currentPrice = useMemo(() => {
    const vp = activeVariant ? Number(activeVariant.price ?? basePrice) : basePrice
    if (!flashSale) return vp
    if (flashSale.discountType === "PERCENTAGE") return Math.round(vp * (1 - Number(flashSale.discountValue) / 100))
    return Math.max(0, vp - Number(flashSale.discountValue))
  }, [activeVariant, basePrice, flashSale])

  const strikePrice = useMemo(() => {
    if (flashSale) return variantBasePrice
    // Variant-level compare price takes priority over product-level
    if (activeVariant?.comparePrice) return Number(activeVariant.comparePrice)
    if (comparePrice && !activeVariant?.price) return comparePrice
    return null
  }, [activeVariant, basePrice, comparePrice, flashSale, variantBasePrice])

  const addToCart = () => {
    if (!activeVariant) return toast.error("Please select a variant.")
    if (isOutOfStock) return toast.error("This item is currently out of stock.")

    const price = activeVariant.price ?? product.price
    const image = product.images?.[0]?.url || ""

    addItem({
      id: activeVariant.id,
      variantId: activeVariant.id,
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: Number(price),
      size: selectedSize!,
      color: selectedColor!,
      image,
      quantity: 1,
    })

    trackAddToCart({
      productId: product.id,
      variantSku: activeVariant.sku,
      name: product.name,
      price: Number(price),
      quantity: 1,
      size: selectedSize!,
      color: selectedColor!,
      category: product.category?.name,
    })

    toast.success(`Added to cart!`, {
      description: `${product.name} — ${selectedSize} / ${selectedColor}`,
    })
  }

  return (
    <div className="space-y-8">
      {/* Dynamic price — updates on variant change */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-2xl font-bold">৳{currentPrice.toLocaleString()}</span>
        {strikePrice && strikePrice !== currentPrice && (
          <span className="font-mono text-lg text-novo-text-muted line-through">
            ৳{Math.round(strikePrice).toLocaleString()}
          </span>
        )}
        {flashSale && (
          <span className="bg-novo-error text-white px-2 py-1 text-xs font-bold rounded uppercase tracking-widest">
            {flashSale.discountType === "PERCENTAGE" ? `${flashSale.discountValue}% off` : `৳${flashSale.discountValue} off`}
          </span>
        )}
        {!flashSale && comparePrice && !activeVariant?.price && (
          <span className="bg-novo-error/10 text-novo-error px-2 py-1 text-xs font-bold rounded uppercase tracking-widest">Sale</span>
        )}
      </div>

      {/* Colors / Attribute 2 */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-novo-black">{attr2Label}</h3>
            <span className="text-xs text-novo-text-muted">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {colors.map(color => {
              const hasStock = variants.some((v: any) => v.color === color && v.stock > 0)
              const variant = variants.find((v: any) => v.color === color)
              const isActive = selectedColor === color

              const hexMap: Record<string, string> = {
                'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#1e3a8a', 'Olive': '#4d7c0f', 'Beige': '#f5f5dc'
              }
              const colorHex = variant?.colorHex || hexMap[color] || '#cccccc'

              return (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  disabled={!hasStock}
                  title={color}
                  className={`relative w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center
                    ${isActive ? 'scale-110 shadow-sm' : 'border-transparent hover:scale-110 hover:shadow-sm'}
                    ${!hasStock ? 'opacity-30 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: colorHex, border: isActive ? '2px solid #C9A84C' : colorHex === '#FFFFFF' ? '1px solid #E8E8E4' : 'none' }}
                >
                  {!hasStock && (
                    <div className="absolute inset-0 w-full h-full border-t border-novo-error transform rotate-45 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sizes / Attribute 1 */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-novo-black">{attr1Label}</h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {sizes.map(size => {
              const specificVariant = variants.find((v: any) => v.size === size && v.color === selectedColor)
              const hasStock = specificVariant && specificVariant.stock > 0
              const isActive = selectedSize === size

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  disabled={!hasStock}
                  className={`relative flex flex-col items-center justify-center border transition-all duration-300 h-14
                    ${isActive ? 'border-novo-black bg-novo-black text-white' : 'border-novo-border bg-white text-novo-black hover:border-novo-black'}
                    ${!hasStock ? 'opacity-40 cursor-not-allowed bg-novo-muted' : ''}`}
                >
                  <span className="text-xs font-medium">{size}</span>
                  {hasStock && specificVariant.stock <= 5 && (
                    <span className={`text-[10px] mt-0.5 ${isActive ? 'text-novo-muted' : 'text-novo-error'}`}>
                      {specificVariant.stock} left
                    </span>
                  )}
                  {hasStock && specificVariant.stock > 5 && isActive && (
                    <span className="text-[10px] mt-0.5 text-novo-muted">
                      In stock
                    </span>
                  )}
                  {!hasStock && (
                    <div className="absolute inset-0 w-full h-full border-t border-novo-border transform rotate-12 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Action */}
      <div className="pt-4 space-y-4">
        {!isOutOfStock ? (
          <button
            onClick={addToCart}
            disabled={!activeVariant}
            className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-novo-black text-white hover:bg-novo-blue hover:shadow-lg hover:shadow-novo-blue/20"
          >
            Add to Cart
          </button>
        ) : (
          <NotifyMeForm variantId={activeVariant?.id || ""} />
        )}

        {stock > 0 && stock <= 5 && (
          <p className="text-xs font-medium text-novo-error flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-novo-error block" />
            Only {stock} left in stock — order soon!
          </p>
        )}
      </div>
    </div>
  )
}
