"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Loader2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  images: { url: string }[]
  category?: { name: string }
}

const POPULAR = ["White Shirt", "Chinos", "Kurti", "Tote Bag", "Polo"]

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.products || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onClose()
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Search bar at top */}
      <div
        className="bg-novo-surface border-b border-novo-border shadow-lg animate-in slide-in-from-top duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <Search className="w-5 h-5 text-novo-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, categories..."
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-novo-text-muted"
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-novo-text-muted shrink-0" />}
            <button type="button" onClick={onClose} className="p-1 text-novo-text-muted hover:text-novo-black transition-colors">
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Results dropdown */}
        <div className="container mx-auto px-4 pb-4 max-h-[70vh] overflow-y-auto">
          {query.length < 2 ? (
            <div className="py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-novo-text-muted mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" /> Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="text-sm border border-novo-border px-3 py-1.5 rounded-full hover:border-novo-blue hover:text-novo-blue transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <p className="text-sm text-novo-text-muted py-4 text-center">No results for "{query}"</p>
          ) : (
            <div className="divide-y divide-novo-border">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 py-3 hover:bg-novo-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="w-14 h-16 shrink-0 rounded-md overflow-hidden bg-novo-muted">
                    <img
                      src={product.images[0]?.url || "/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-novo-text-muted uppercase tracking-widest">{product.category?.name}</p>
                    <p className="font-medium text-sm line-clamp-1 mt-0.5">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm font-bold">৳{Number(product.price).toLocaleString()}</span>
                      {product.comparePrice && (
                        <span className="font-mono text-xs text-novo-text-muted line-through">৳{Number(product.comparePrice).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {results.length > 0 && (
                <button
                  onClick={handleSubmit as any}
                  className="w-full text-center text-sm text-novo-blue font-medium py-3 hover:underline"
                >
                  See all results for "{query}" →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      <div className="flex-1 bg-black/40 animate-in fade-in duration-200" />
    </div>
  )
}
