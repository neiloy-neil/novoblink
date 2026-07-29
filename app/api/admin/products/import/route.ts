import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

// POST /api/admin/products/import
// Body: { rows: ParsedRow[], dryRun: boolean }
// ParsedRow: { name, slug, price, comparePrice, category, tags, sku, size, color, stock, costPrice, imageUrl }

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { rows, dryRun = true } = await req.json()
  if (!rows?.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 })

  const results: { row: number; status: "ok" | "error" | "skip"; message?: string }[] = []
  let created = 0, skipped = 0, errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      // Validate required fields
      if (!row.name) throw new Error("Missing: name")
      if (!row.price || isNaN(Number(row.price))) throw new Error("Missing or invalid: price")
      if (!row.category) throw new Error("Missing: category")
      if (!row.sku) throw new Error("Missing: sku")
      if (!row.size) throw new Error("Missing: size")
      if (!row.color) throw new Error("Missing: color")

      if (dryRun) {
        results.push({ row: i + 1, status: "ok", message: `Will create: ${row.name} (${row.sku})` })
        created++
        continue
      }

      // Find or create category
      const catSlug = row.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      let category = await prisma.category.findUnique({ where: { slug: catSlug } })
      if (!category) {
        category = await prisma.category.create({ data: { name: row.category, slug: catSlug } })
      }

      // Find or create product
      const productSlug = (row.slug || row.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")
      let product = await prisma.product.findUnique({ where: { slug: productSlug } })
      if (!product) {
        product = await prisma.product.create({
          data: {
            name: row.name,
            slug: productSlug,
            price: Number(row.price),
            comparePrice: row.comparePrice ? Number(row.comparePrice) : null,
            categoryId: category.id,
            tags: row.tags || null,
            isActive: true,
          },
        })
        // Add image if provided
        if (row.imageUrl) {
          await prisma.productImage.create({ data: { productId: product.id, url: row.imageUrl, sortOrder: 0 } })
        }
      }

      // Create variant (or skip if SKU exists)
      const existingVariant = await prisma.productVariant.findUnique({ where: { sku: row.sku } })
      if (existingVariant) {
        results.push({ row: i + 1, status: "skip", message: `SKU already exists: ${row.sku}` })
        skipped++
        continue
      }

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: row.sku,
          size: row.size,
          color: row.color,
          stock: Number(row.stock || 0),
          costPrice: Number(row.costPrice || 0),
          price: row.variantPrice ? Number(row.variantPrice) : null,
        },
      })

      results.push({ row: i + 1, status: "ok", message: `Created: ${row.name} — ${row.sku}` })
      created++
    } catch (e: any) {
      results.push({ row: i + 1, status: "error", message: e.message })
      errors++
    }
  }

  return NextResponse.json({ dryRun, total: rows.length, created, skipped, errors, results })
}
