"use client"

import Link from "next/link"
import Image from "next/image"
import { Search, Heart, User, Menu, X, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { useCartStore } from "@/store/useCartStore"
import { useWishlistStore } from "@/store/useWishlistStore"
import CartDrawer from "@/components/store/CartDrawer"
import SearchModal from "@/components/store/SearchModal"

type NavCategory = { id: string; name: string; slug: string }
type NavFlashSale = { name: string; discountType: string; discountValue: number; endsAt: string }

function useCountdown(endsAt: string) {
  const [label, setLabel] = useState("")
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setLabel(""); return }
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
      const pad = (n: number) => String(n).padStart(2, "0")
      setLabel(`${pad(h)}:${pad(m)}:${pad(s)}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return label
}

export default function Navbar({
  freeShippingThreshold = null,
  storeName = "NovoBlink",
  storeTagline = "Wear Your Story",
  categories = [],
  activeFlashSale = null,
}: {
  freeShippingThreshold?: number | null
  storeName?: string
  storeTagline?: string
  categories?: NavCategory[]
  activeFlashSale?: NavFlashSale | null
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0))
  const wishlistCount = useWishlistStore((s) => s.items.length)
  const navCategories = categories.slice(0, 4)
  const flashCountdown = useCountdown(activeFlashSale?.endsAt || "")
  const flashLabel = activeFlashSale
    ? activeFlashSale.discountType === "PERCENTAGE"
      ? `${activeFlashSale.discountValue}% off`
      : `৳${activeFlashSale.discountValue} off`
    : ""

  return (
    <>
      {/* Announcement Bar */}
      <div className={`text-novo-surface text-center py-2 text-xs md:text-sm font-medium tracking-wide overflow-hidden transition-colors ${activeFlashSale && flashCountdown ? "bg-novo-error" : "bg-novo-black"}`}>
        {activeFlashSale && flashCountdown ? (
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3">
            <Zap className="w-3 h-3 inline shrink-0" />
            <span>{activeFlashSale.name} — {flashLabel} sitewide!</span>
            <span className="font-mono">Ends in {flashCountdown}</span>
            <Zap className="w-3 h-3 inline shrink-0" />
          </p>
        ) : (
          <p>{freeShippingThreshold ? `Free delivery on orders above ৳${freeShippingThreshold} 🚚` : "Fast delivery across Bangladesh 🚚"}</p>
        )}
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-novo-border bg-novo-surface/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-4 md:w-1/3">
            <button
              className="md:hidden p-2 -ml-2 text-novo-text"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center">
              <Image
                src="https://ybzrmqwumhrmhndwwpyv.supabase.co/storage/v1/object/public/product-images/logos/novoblink-horizontal.png"
                alt={storeName}
                width={200}
                height={46}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center justify-center gap-8 w-1/3">
            <Link href="/" className="text-sm font-medium hover:text-novo-blue transition-colors">Home</Link>
            <Link href="/shop" className="text-sm font-medium hover:text-novo-blue transition-colors">Shop</Link>
            {navCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?categoryId=${cat.id}`}
                className="text-sm font-medium hover:text-novo-blue transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            <Link href="/shop?sort=newest" className="text-sm font-medium hover:text-novo-blue transition-colors">New Arrivals</Link>
            <Link href="/shop?sale=true" className="text-sm font-medium text-novo-error hover:text-novo-error/80 transition-colors">Sale</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center justify-end gap-3 md:gap-5 w-1/3">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-novo-text hover:text-novo-blue transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <Link href="/wishlist" className="p-2 hidden md:block relative text-novo-text hover:text-novo-blue transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5 md:w-6 md:h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-novo-error text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/login" className="p-2 hidden md:block text-novo-text hover:text-novo-blue transition-colors" aria-label="Account">
              <User className="w-5 h-5 md:w-6 md:h-6" />
            </Link>

            <CartDrawer itemCount={itemCount} freeShippingThreshold={freeShippingThreshold} />
          </div>

        </div>
      </header>

      {/* Search Modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-novo-surface p-8 flex flex-col gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Image
                src="https://ybzrmqwumhrmhndwwpyv.supabase.co/storage/v1/object/public/product-images/logos/novoblink-horizontal.png"
                alt={storeName}
                width={160}
                height={37}
                className="h-8 w-auto"
              />
              <button onClick={() => setMobileOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-lg font-medium">
              <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors">Home</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors">Shop</Link>
              {navCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?categoryId=${cat.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="hover:text-novo-blue transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link href="/shop?sort=newest" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors">New Arrivals</Link>
              <Link href="/shop?sale=true" onClick={() => setMobileOpen(false)} className="text-novo-error">Sale</Link>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors flex items-center gap-2">
                Wishlist {wishlistCount > 0 && <span className="bg-novo-error text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{wishlistCount}</span>}
              </Link>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors">My Account</Link>
              <Link href="/cart" onClick={() => setMobileOpen(false)} className="hover:text-novo-blue transition-colors">Cart ({itemCount})</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
