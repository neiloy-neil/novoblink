"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react"

type Category = { id: string; name: string }
type Brand = { id: string; name: string }

type Props = {
  categories: Category[]
  brands: Brand[]
  current: {
    categoryId: string
    brandId: string
    size: string
    color: string
    sort: string
    minPrice: string
    maxPrice: string
    sale: string
    search?: string
  }
}

const COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Red", hex: "#dc2626" },
  { name: "Grey", hex: "#6b7280" },
]

export default function ShopFilters({ categories, brands, current }: Props) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(current.minPrice || "")
  const [maxPrice, setMaxPrice] = useState(current.maxPrice || "")

  const hasActiveFilters = !!(current.categoryId || current.brandId || current.size || current.color || current.minPrice || current.maxPrice || current.sale)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    const base = { ...current, ...overrides }
    if (base.categoryId) p.set("categoryId", base.categoryId)
    if (base.brandId) p.set("brandId", base.brandId)
    if (base.size) p.set("size", base.size)
    if (base.color) p.set("color", base.color)
    if (base.sort && base.sort !== "newest") p.set("sort", base.sort)
    if (base.minPrice) p.set("minPrice", base.minPrice)
    if (base.maxPrice) p.set("maxPrice", base.maxPrice)
    if (base.sale) p.set("sale", base.sale)
    if (base.search) p.set("search", base.search)
    return `/shop?${p.toString()}`
  }

  function navigate(overrides: Record<string, string>) {
    router.push(buildUrl(overrides))
    setMobileOpen(false)
  }

  function applyPrice() {
    navigate({ minPrice, maxPrice })
  }

  function clearPrice() {
    setMinPrice("")
    setMaxPrice("")
    navigate({ minPrice: "", maxPrice: "" })
  }

  const filterContent = (
    <div className="space-y-8">
      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={() => { setMinPrice(""); setMaxPrice(""); router.push("/shop"); setMobileOpen(false) }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="w-3 h-3" /> Clear All Filters
        </button>
      )}

      {/* Category */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-widest text-novo-text-muted">Category</h4>
        <ul className="space-y-2.5 text-sm">
          <li>
            <button
              onClick={() => navigate({ categoryId: "", brandId: "" })}
              className={`flex items-center gap-3 w-full text-left hover:text-novo-blue transition-colors ${!current.categoryId ? "text-novo-black font-semibold" : "text-novo-text-muted"}`}
            >
              <div className={`w-4 h-4 rounded border shrink-0 ${!current.categoryId ? "bg-novo-blue border-novo-blue" : "border-novo-border"}`} />
              All Products
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => navigate({ categoryId: current.categoryId === cat.id ? "" : cat.id })}
                className={`flex items-center gap-3 w-full text-left hover:text-novo-blue transition-colors ${current.categoryId === cat.id ? "text-novo-black font-semibold" : "text-novo-text-muted"}`}
              >
                <div className={`w-4 h-4 rounded border shrink-0 ${current.categoryId === cat.id ? "bg-novo-blue border-novo-blue" : "border-novo-border"}`} />
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-widest text-novo-text-muted">Brand</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                onClick={() => navigate({ brandId: "" })}
                className={`flex items-center gap-3 w-full text-left hover:text-novo-blue transition-colors ${!current.brandId ? "text-novo-black font-semibold" : "text-novo-text-muted"}`}
              >
                <div className={`w-4 h-4 rounded border shrink-0 ${!current.brandId ? "bg-novo-blue border-novo-blue" : "border-novo-border"}`} />
                All Brands
              </button>
            </li>
            {brands.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => navigate({ brandId: current.brandId === b.id ? "" : b.id })}
                  className={`flex items-center gap-3 w-full text-left hover:text-novo-blue transition-colors ${current.brandId === b.id ? "text-novo-black font-semibold" : "text-novo-text-muted"}`}
                >
                  <div className={`w-4 h-4 rounded border shrink-0 ${current.brandId === b.id ? "bg-novo-blue border-novo-blue" : "border-novo-border"}`} />
                  {b.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Color */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-widest text-novo-text-muted">Color</h4>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => {
            const isActive = current.color === c.name
            return (
              <button
                key={c.name}
                onClick={() => navigate({ color: isActive ? "" : c.name })}
                title={c.name}
                className={`w-8 h-8 rounded-full transition-all ${isActive ? "ring-2 ring-offset-2 ring-novo-blue scale-110" : "hover:scale-110"}`}
                style={{
                  backgroundColor: c.hex,
                  border: c.hex === "#FFFFFF" ? "1px solid #E8E8E4" : "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-widest text-novo-text-muted">Price Range (৳)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min={0}
            className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-3 py-2 text-sm outline-none transition-all"
          />
          <span className="text-novo-text-muted text-xs shrink-0">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min={0}
            className="w-full bg-novo-muted border border-transparent focus:border-novo-blue focus:bg-white rounded-lg px-3 py-2 text-sm outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyPrice}
            className="flex-1 py-2 bg-novo-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-novo-blue transition-colors"
          >
            Apply
          </button>
          {(current.minPrice || current.maxPrice) && (
            <button
              onClick={clearPrice}
              className="px-3 py-2 border border-novo-border text-xs rounded-lg hover:border-novo-black transition-colors text-novo-text-muted"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Sale toggle */}
      <div className="space-y-3">
        <h4 className="font-bold text-xs uppercase tracking-widest text-novo-text-muted">Offers</h4>
        <button
          onClick={() => navigate({ sale: current.sale === "true" ? "" : "true" })}
          className={`flex items-center gap-3 w-full text-left text-sm hover:text-novo-blue transition-colors ${current.sale === "true" ? "text-novo-black font-semibold" : "text-novo-text-muted"}`}
        >
          <div className={`w-4 h-4 rounded border shrink-0 ${current.sale === "true" ? "bg-novo-blue border-novo-blue" : "border-novo-border"}`} />
          Sale Items Only
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile filter button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 text-sm font-medium border border-novo-border px-4 py-2 rounded-full"
      >
        <Filter className="w-4 h-4" /> Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-novo-blue inline-block" />}
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Filters</h3>
              <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-novo-muted rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm uppercase tracking-widest">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={() => { setMinPrice(""); setMaxPrice(""); router.push("/shop") }}
              className="text-xs text-novo-text-muted hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        {filterContent}
      </div>
    </>
  )
}
