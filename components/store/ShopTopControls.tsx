"use client"

import { useRouter } from "next/navigation"
import { Grid3X3, List as ListIcon } from "lucide-react"

type Props = {
  current: {
    sort: string
    view: string
    categoryId: string
    brandId: string
    size: string
    color: string
    minPrice: string
    maxPrice: string
    sale: string
    search: string
    take: string
  }
}

export default function ShopTopControls({ current }: Props) {
  const router = useRouter()

  function buildUrl(overrides: Partial<typeof current>) {
    const merged = { ...current, ...overrides }
    const p = new URLSearchParams()
    if (merged.categoryId) p.set("categoryId", merged.categoryId)
    if (merged.brandId) p.set("brandId", merged.brandId)
    if (merged.size) p.set("size", merged.size)
    if (merged.color) p.set("color", merged.color)
    if (merged.sort && merged.sort !== "newest") p.set("sort", merged.sort)
    if (merged.minPrice) p.set("minPrice", merged.minPrice)
    if (merged.maxPrice) p.set("maxPrice", merged.maxPrice)
    if (merged.sale) p.set("sale", merged.sale)
    if (merged.search) p.set("search", merged.search)
    if (merged.take && merged.take !== "12") p.set("take", merged.take)
    if (merged.view && merged.view !== "grid") p.set("view", merged.view)
    return `/shop?${p.toString()}`
  }

  const isGrid = current.view !== "list"

  return (
    <div className="flex items-center gap-4">
      {/* Sort select */}
      <select
        value={current.sort}
        onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
        className="border-none bg-novo-muted text-novo-text text-sm px-4 py-2 rounded-full focus:ring-1 focus:ring-novo-blue outline-none cursor-pointer"
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>

      {/* Grid / List toggle */}
      <div className="hidden md:flex items-center gap-1 bg-novo-muted p-1 rounded-full text-novo-text-muted">
        <button
          onClick={() => router.push(buildUrl({ view: "grid" }))}
          className={`p-1.5 rounded-full transition-colors ${isGrid ? "bg-white shadow-sm text-novo-black" : "hover:text-novo-black"}`}
          title="Grid view"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push(buildUrl({ view: "list" }))}
          className={`p-1.5 rounded-full transition-colors ${!isGrid ? "bg-white shadow-sm text-novo-black" : "hover:text-novo-black"}`}
          title="List view"
        >
          <ListIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
