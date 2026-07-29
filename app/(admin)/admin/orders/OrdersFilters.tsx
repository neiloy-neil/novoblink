"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { Search } from "lucide-react"

export default function OrdersFilters({
  currentSearch,
  currentStatus,
  currentPayment,
}: {
  currentSearch: string
  currentStatus: string
  currentPayment: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`/admin/orders?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="p-4 border-b flex flex-wrap gap-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          defaultValue={currentSearch}
          placeholder="Search by order number or customer..."
          onChange={(e) => {
            const v = e.target.value
            clearTimeout((window as any)._orderSearchTimer)
            ;(window as any)._orderSearchTimer = setTimeout(() => update("search", v), 400)
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <select
        defaultValue={currentStatus}
        onChange={(e) => update("status", e.target.value)}
        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PACKED">Packed</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="RETURNED">Returned</option>
      </select>
      <select
        defaultValue={currentPayment}
        onChange={(e) => update("paymentMethod", e.target.value)}
        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      >
        <option value="">All Payments</option>
        <option value="BKASH">bKash</option>
        <option value="NAGAD">Nagad</option>
        <option value="COD">COD</option>
      </select>
    </div>
  )
}
