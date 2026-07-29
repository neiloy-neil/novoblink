import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await prisma.product.findMany({
    include: {
      category: { select: { name: true } },
      variants: { select: { sku: true, size: true, color: true, stock: true, price: true } },
      images: { select: { url: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  })

  const rows: string[] = [
    "name,slug,category,price,comparePrice,costPrice,tags,description,isActive,sku,size,color,stock,variantPrice,imageUrl",
  ]

  for (const p of products) {
    const base = [
      csv(p.name),
      csv(p.slug),
      csv(p.category?.name || ""),
      csv(String(Number(p.price))),
      csv(p.comparePrice ? String(Number(p.comparePrice)) : ""),
      csv(""),
      csv(Array.isArray(p.tags) ? (p.tags as string[]).join("|") : ""),
      csv(p.description || ""),
      csv(p.isActive ? "true" : "false"),
    ]
    const imageUrl = p.images[0]?.url || ""

    if (p.variants.length === 0) {
      rows.push([...base, "", "", "", "", "", csv(imageUrl)].join(","))
    } else {
      for (const v of p.variants) {
        rows.push([
          ...base,
          csv(v.sku || ""),
          csv(v.size || ""),
          csv(v.color || ""),
          csv(String(v.stock)),
          csv(v.price ? String(Number(v.price)) : ""),
          csv(imageUrl),
        ].join(","))
      }
    }
  }

  const csv_content = rows.join("\n")
  return new NextResponse(csv_content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  })
}

function csv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}
