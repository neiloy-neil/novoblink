"use client"

import { useCompareStore } from "@/store/useCompareStore"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, ArrowLeft } from "lucide-react"

const ATTRIBUTES = ["price", "comparePrice", "category", "brand", "tags"] as const

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-3">No products to compare</h1>
        <p className="text-muted-foreground mb-6">Add products to compare by clicking the compare button on any product card.</p>
        <Link href="/shop"><Button>Browse Products</Button></Link>
      </div>
    )
  }

  const rows = [
    { label: "Price", key: "price", render: (v: any) => v ? `৳${Number(v).toLocaleString()}` : "—" },
    { label: "Compare Price", key: "comparePrice", render: (v: any) => v ? `৳${Number(v).toLocaleString()}` : "—" },
    { label: "Category", key: "category", render: (v: any) => v || "—" },
    { label: "Brand", key: "brand", render: (v: any) => v || "—" },
    { label: "Tags", key: "tags", render: (v: any) => v || "—" },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compare Products</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>Clear all</Button>
          <Link href="/shop"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Back to shop</Button></Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 font-medium text-sm text-muted-foreground w-32 border-b">Feature</th>
              {items.map(item => (
                <th key={item.id} className="p-3 border-b text-center min-w-[180px]">
                  <div className="relative">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-muted rounded-full flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="relative aspect-square w-24 mx-auto bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                    </div>
                    <Link href={`/products/${item.slug}`} className="text-sm font-semibold hover:underline line-clamp-2">
                      {item.name}
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 text-sm font-medium text-muted-foreground">{row.label}</td>
                {items.map(item => (
                  <td key={item.id} className="p-3 text-center text-sm">
                    {row.render((item as any)[row.key])}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-3" />
              {items.map(item => (
                <td key={item.id} className="p-3 text-center">
                  <Link href={`/products/${item.slug}`}>
                    <Button size="sm" className="w-full">View product</Button>
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
