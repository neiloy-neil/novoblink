"use client"

import { useCompareStore } from "@/store/useCompareStore"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, BarChart2 } from "lucide-react"

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <BarChart2 className="w-5 h-5 shrink-0 text-primary" />
        <span className="text-sm font-medium shrink-0">Compare ({items.length}/4):</span>
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-1.5 border rounded-lg px-2 py-1 bg-muted shrink-0">
              {item.image && <img src={item.image} alt={item.name} className="w-6 h-6 object-cover rounded" />}
              <span className="text-xs font-medium max-w-[100px] truncate">{item.name}</span>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
          <Link href="/compare">
            <Button size="sm">Compare now</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
