"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, PlusCircle, ShoppingCart, Bell, Menu, Package2, ChevronDown, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/admin/Sidebar"
import { cn } from "@/lib/utils"

type SearchResult = {
  type: "order" | "product" | "customer"
  id: string
  label: string
  sub: string
  href: string
}

export default function AdminTopbar({ email }: { email: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`)
        if (res.ok) { const d = await res.json(); setResults(d.results || []); setOpen(true) }
      } finally { setLoading(false) }
    }, 250)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const go = (href: string) => { setQuery(""); setOpen(false); router.push(href) }

  const typeColor: Record<string, string> = {
    order: "bg-blue-100 text-blue-700",
    product: "bg-green-100 text-green-700",
    customer: "bg-purple-100 text-purple-700",
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-[60px] items-center gap-3 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger render={
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        } />
        <SheetContent side="left" className="flex flex-col p-0 w-[260px]">
          <div className="flex h-14 items-center border-b px-4">
            <span className="flex items-center gap-2 font-bold">
              <Package2 className="h-5 w-5" />
              NovoBlink Admin
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Global search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search orders, products, customers…"
          className="w-full rounded-lg border border-input bg-muted/40 pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border bg-popover shadow-lg overflow-hidden">
            {loading && (
              <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
            )}
            {!loading && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">No results for "{query}"</div>
            )}
            {!loading && results.map((r) => (
              <button
                key={r.href}
                onClick={() => go(r.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors"
              >
                <span className={cn("text-[10px] font-bold uppercase rounded px-1.5 py-0.5 shrink-0", typeColor[r.type])}>
                  {r.type}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{r.label}</span>
                  <span className="block text-xs text-muted-foreground truncate">{r.sub}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick actions */}
        <Link href="/admin/orders/new">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8">
            <ShoppingCart className="h-3.5 w-3.5" />
            New Order
          </Button>
        </Link>
        <Link href="/admin/products/new">
          <Button size="sm" className="hidden sm:flex gap-1.5 h-8">
            <PlusCircle className="h-3.5 w-3.5" />
            New Product
          </Button>
        </Link>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted border text-xs font-bold uppercase">
              {email?.[0] ?? "A"}
            </div>
            <span className="hidden lg:block max-w-[140px] truncate text-xs">{email}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-popover shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-xs font-medium text-foreground truncate">{email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Link
                href="/admin/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                href="/"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                View Store
              </Link>
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
