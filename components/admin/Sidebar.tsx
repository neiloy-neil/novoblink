"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Users, Package, Ticket, Gift, Truck,
  BarChart, Settings, PlusCircle, Building2, ClipboardList, Receipt, FileText,
  Zap, Percent, Tag, RotateCcw, Globe, Link2, MapPin, Layers, ScrollText,
  ShoppingBasket, Upload, CreditCard, Workflow, Wallet, Award, TrendingUp,
  Sliders, ChevronRight, Crown, Calendar, Warehouse, Download, LineChart, PieChart,
  Search, ChevronDown, Mail, MessageSquare, Filter, Sparkles, TrendingDown,
} from "lucide-react"

type NavItem = { href: string; icon: any; label: string }
type NavGroup = { label: string; icon: any; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: "Catalog",
    icon: ShoppingBag,
    items: [
      { href: "/admin/products", icon: ShoppingBag, label: "Products" },
      { href: "/admin/categories", icon: Tag, label: "Categories" },
      { href: "/admin/brands", icon: Award, label: "Brands" },
      { href: "/admin/bundles", icon: Layers, label: "Bundles" },
      { href: "/admin/inventory", icon: Package, label: "Inventory" },
      { href: "/admin/products/import", icon: Upload, label: "Import CSV" },
      { href: "/admin/smart-collections", icon: Sparkles, label: "Collections" },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    items: [
      { href: "/admin/orders", icon: ShoppingCart, label: "All Orders" },
      { href: "/admin/orders/new", icon: PlusCircle, label: "New Order" },
      { href: "/admin/returns", icon: RotateCcw, label: "Returns & RMA" },
      { href: "/admin/reviews", icon: MessageSquare, label: "Reviews" },
      { href: "/admin/abandoned-carts", icon: ShoppingBasket, label: "Abandoned Carts" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    items: [
      { href: "/admin/customers", icon: Users, label: "All Customers" },
      { href: "/admin/store-credit", icon: Wallet, label: "Store Credit" },
      { href: "/admin/loyalty", icon: Gift, label: "Loyalty Points" },
      { href: "/admin/memberships", icon: Crown, label: "Memberships" },
      { href: "/admin/affiliates", icon: Link2, label: "Affiliates" },
    ],
  },
  {
    label: "Marketing",
    icon: Zap,
    items: [
      { href: "/admin/coupons", icon: Ticket, label: "Coupons" },
      { href: "/admin/flash-sales", icon: Zap, label: "Flash Sales" },
      { href: "/admin/auto-discounts", icon: Percent, label: "Auto Discounts" },
      { href: "/admin/price-rules", icon: TrendingUp, label: "Price Rules" },
      { href: "/admin/gift-cards", icon: CreditCard, label: "Gift Cards" },
      { href: "/admin/order-bumps", icon: ChevronRight, label: "Order Bumps" },
      { href: "/admin/workflows", icon: Workflow, label: "Workflows" },
      { href: "/admin/campaigns", icon: Mail, label: "Campaigns" },
    ],
  },
  {
    label: "Finance",
    icon: Receipt,
    items: [
      { href: "/admin/suppliers", icon: Building2, label: "Suppliers" },
      { href: "/admin/purchase-orders", icon: ClipboardList, label: "Purchase Orders" },
      { href: "/admin/expenses", icon: Receipt, label: "Expenses" },
    ],
  },
  {
    label: "Shipping",
    icon: Truck,
    items: [
      { href: "/admin/shipping-zones", icon: MapPin, label: "Shipping Zones" },
      { href: "/admin/delivery", icon: Truck, label: "Delivery Methods" },
      { href: "/admin/locations", icon: Warehouse, label: "Locations" },
    ],
  },
  {
    label: "Checkout & UX",
    icon: Sliders,
    items: [
      { href: "/admin/checkout-fields", icon: Sliders, label: "Checkout Fields" },
      { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
    ],
  },
  {
    label: "Content",
    icon: Globe,
    items: [
      { href: "/admin/blog", icon: Globe, label: "Blog" },
      { href: "/admin/pages", icon: FileText, label: "Pages" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart,
    items: [
      { href: "/admin/reports", icon: BarChart, label: "Reports" },
      { href: "/admin/analytics/products", icon: LineChart, label: "Product Analytics" },
      { href: "/admin/analytics/cohorts", icon: PieChart, label: "Cohort & LTV" },
      { href: "/admin/analytics/search", icon: Search, label: "Search Analytics" },
      { href: "/admin/analytics/funnel", icon: Filter, label: "Funnel" },
      { href: "/admin/export", icon: Download, label: "Export Data" },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
      { href: "/admin/audit-log", icon: ScrollText, label: "Audit Log" },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [search, setSearch] = useState("")

  const defaultOpen = navGroups.reduce<Record<string, boolean>>((acc, g) => {
    acc[g.label] = g.items.some(
      (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
    )
    return acc
  }, {})
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen)

  const query = search.toLowerCase().trim()
  const toggle = (label: string) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  const allItems = navGroups.flatMap((g) => g.items)
  const filtered = query ? allItems.filter((i) => i.label.toLowerCase().includes(query)) : null

  const activeLink = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href))

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {/* Dashboard */}
      <Link
        href="/admin"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          activeLink("/admin") && pathname === "/admin"
            ? "bg-amber-500 text-slate-900 shadow-sm"
            : "text-slate-400 hover:bg-white/8 hover:text-white"
        )}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        Dashboard
      </Link>

      {/* Search */}
      <div className="relative my-2">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search menu…"
          className="w-full rounded-md bg-white/8 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white/12 transition-all"
        />
      </div>

      {/* Filtered flat results */}
      {filtered ? (
        <div className="flex flex-col gap-0.5">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-500">No results</p>
          )}
          {filtered.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSearch("")}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                activeLink(item.href)
                  ? "bg-amber-500 text-slate-900 font-medium shadow-sm"
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 mt-1">
          {navGroups.map((group) => {
            const isOpen = !!openGroups[group.label]
            const hasActive = group.items.some((item) => activeLink(item.href))
            return (
              <div key={group.label}>
                <button
                  onClick={() => toggle(group.label)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all",
                    hasActive
                      ? "text-amber-400"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <group.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 shrink-0 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="ml-2 mb-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {group.items.map((item) => {
                      const isActive = activeLink(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all",
                            isActive
                              ? "bg-amber-500/15 text-amber-400 font-medium border-l-2 border-amber-500 -ml-[13px] pl-[14px]"
                              : "text-slate-400 hover:bg-white/8 hover:text-white"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </nav>
  )
}
