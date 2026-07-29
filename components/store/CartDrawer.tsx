"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Minus, Plus, Trash2, Tag, ChevronRight, Zap } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type CartBump = {
  id: string
  headline: string
  discountPct: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: { url: string }[]
    variants: { id: string; size: string; color: string; stock: number }[]
  }
}

export default function CartDrawer({ itemCount: propItemCount, freeShippingThreshold = 1000 }: { itemCount?: number, freeShippingThreshold?: number }) {
  const { items, removeItem, updateQuantity, addItem } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  const [bump, setBump] = useState<CartBump | null>(null)
  const [bumpAdded, setBumpAdded] = useState(false)
  const [coupon, setCoupon] = useState("")

  useEffect(() => {
    if (!isOpen || bump) return
    fetch("/api/store/order-bumps")
      .then(r => r.json())
      .then(d => { if (d.bumps?.length) setBump(d.bumps[0]) })
      .catch(() => {})
  }, [isOpen])
  const [useLoyalty, setUseLoyalty] = useState(false)

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const itemCount = propItemCount ?? items.reduce((acc, item) => acc + item.quantity, 0)
  const loyaltyPoints = 0 // Fetched at checkout when user is authenticated
  const loyaltyValue = useLoyalty ? Math.min(loyaltyPoints * 0.1, subtotal * 0.2) : 0
  const finalTotal = subtotal - loyaltyValue

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <Button variant="ghost" size="icon-sm" className="relative text-novo-black hover:text-novo-blue">
          <ShoppingBag className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-novo-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      } />
      
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 border-l border-novo-border bg-novo-surface">
        <SheetHeader className="p-6 border-b border-novo-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-2xl">Your Bag</SheetTitle>
            <span className="text-xs uppercase tracking-widest text-novo-text-muted font-bold">{items.length} items</span>
          </div>
          {/* Free Shipping Progress */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-novo-text-muted">
              {subtotal >= freeShippingThreshold ? "You've unlocked free shipping!" : `Add ৳${freeShippingThreshold - subtotal} more for free shipping`}
            </p>
            <div className="w-full h-1 bg-novo-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-novo-blue transition-all duration-500"
                style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-novo-muted flex items-center justify-center text-novo-border">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-heading text-xl">Your bag is empty.</p>
              <p className="text-sm text-novo-text-muted">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-4 border-b border-novo-black font-medium uppercase tracking-widest text-xs pb-1 hover:text-novo-blue hover:border-novo-blue transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <Link href={`/shop/${item.productSlug}`} className="relative h-32 w-24 shrink-0 overflow-hidden bg-novo-muted rounded-sm block">
                    <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link href={`/shop/${item.productSlug}`} className="font-medium text-sm line-clamp-2 hover:text-novo-blue transition-colors">
                          {item.name}
                        </Link>
                        <button onClick={() => removeItem(item.variantId)} className="text-novo-text-muted hover:text-novo-error transition-colors mt-0.5">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-novo-text-muted mt-1 uppercase tracking-wider">{item.size} / {item.color}</p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-novo-border rounded-full overflow-hidden">
                        <button 
                          className="px-3 py-1.5 text-novo-text-muted hover:text-novo-black transition-colors"
                          onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                        <button 
                          className="px-3 py-1.5 text-novo-text-muted hover:text-novo-black transition-colors"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono font-medium">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-novo-border bg-novo-muted/30 p-6 space-y-6">
            
            {/* Promo & Loyalty */}
            <div className="space-y-3">
              <div className="flex items-center border border-novo-border rounded-lg bg-white overflow-hidden p-1 shadow-sm">
                <Tag className="w-4 h-4 text-novo-text-muted ml-2" />
                <input 
                  type="text" 
                  placeholder="Promo Code" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-novo-border"
                />
                <button className="bg-novo-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-md hover:bg-novo-blue transition-colors">
                  Apply
                </button>
              </div>
              
              <div className="flex items-center justify-between border border-novo-border rounded-lg bg-white p-3 shadow-sm">
                <div>
                  <p className="text-sm font-bold flex items-center gap-1">NovoBlink <span className="text-novo-blue">Club</span></p>
                  <p className="text-xs text-novo-text-muted">Use {loyaltyPoints} points for ৳{loyaltyValue.toLocaleString()} off</p>
                </div>
                <Switch checked={useLoyalty} onCheckedChange={setUseLoyalty} />
              </div>
            </div>
            
            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-novo-text-muted">
                <span>Subtotal</span>
                <span className="font-mono">৳{subtotal.toLocaleString()}</span>
              </div>
              {useLoyalty && (
                <div className="flex justify-between text-novo-success">
                  <span>Loyalty Points</span>
                  <span className="font-mono">-৳{loyaltyValue.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-novo-border">
                <span>Total</span>
                <span className="font-mono">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Cart upsell */}
            {bump && !bumpAdded && items.length > 0 && (() => {
              const discountedPrice = Math.round(Number(bump.product.price) * (1 - bump.discountPct / 100))
              const variant = bump.product.variants.find(v => v.stock > 0) || bump.product.variants[0]
              if (!variant) return null
              return (
                <div className="border border-novo-blue/40 rounded-xl overflow-hidden bg-novo-blue/5">
                  <div className="bg-novo-blue/10 px-3 py-1.5 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-novo-blue fill-novo-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-novo-black">Add to your order</span>
                  </div>
                  <div className="p-3 flex gap-3 items-center">
                    <div className="relative h-14 w-11 shrink-0 rounded overflow-hidden bg-novo-muted">
                      <Image src={bump.product.images[0]?.url || "/placeholder.jpg"} alt={bump.product.name} fill sizes="44px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{bump.headline}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-sm font-bold text-novo-blue">৳{discountedPrice.toLocaleString()}</span>
                        {bump.discountPct > 0 && <span className="font-mono text-xs text-novo-text-muted line-through">৳{Number(bump.product.price).toLocaleString()}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addItem({ id: variant.id, variantId: variant.id, productId: bump.product.id, productSlug: bump.product.slug, name: bump.product.name, size: variant.size, color: variant.color, price: discountedPrice, image: bump.product.images[0]?.url || "", quantity: 1 })
                        setBumpAdded(true)
                        toast.success("Added!")
                      }}
                      className="shrink-0 px-3 py-1.5 bg-novo-black text-white text-[11px] font-bold rounded-full hover:bg-novo-blue transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )
            })()}

            <div className="space-y-3">
              <Link href="/checkout" onClick={() => setIsOpen(false)} className="block">
                <button className="w-full py-4 bg-novo-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-novo-blue hover:shadow-lg hover:shadow-novo-blue/20 transition-all duration-300 rounded-lg">
                  Secure Checkout <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/cart" onClick={() => setIsOpen(false)} className="block text-center text-xs text-novo-text-muted hover:text-novo-black underline underline-offset-4 transition-colors">
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
