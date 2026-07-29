"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search } from "lucide-react"

export default function ProductsFilters({ currentSearch }: { currentSearch: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`/admin/products?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="p-4 border-b">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          defaultValue={currentSearch}
          placeholder="Search products..."
          onChange={(e) => {
            const v = e.target.value
            clearTimeout((window as any)._productSearchTimer)
            ;(window as any)._productSearchTimer = setTimeout(() => update("search", v), 400)
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
    </div>
  )
}
