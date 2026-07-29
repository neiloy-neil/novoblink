import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { logAudit } from "@/lib/auditLog"

// POST /api/admin/inventory/bulk
// Body: { rows: [{ variantId: string, stock: number }] }
// OR multipart CSV with columns: variantId,stock
export async function POST(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const contentType = req.headers.get("content-type") || ""

  let rows: { variantId: string; stock: number }[] = []

  if (contentType.includes("application/json")) {
    const body = await req.json()
    rows = body.rows || []
  } else {
    // Parse CSV text body
    const text = await req.text()
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean)
    const header = lines[0]?.toLowerCase()
    const startIdx = header?.includes("variantid") ? 1 : 0
    for (let i = startIdx; i < lines.length; i++) {
      const [variantId, stockStr] = lines[i].split(",").map(s => s.trim())
      const stock = parseInt(stockStr, 10)
      if (variantId && !isNaN(stock) && stock >= 0) {
        rows.push({ variantId, stock })
      }
    }
  }

  if (!rows.length) {
    return NextResponse.json({ error: "No valid rows found" }, { status: 400 })
  }

  const results = await Promise.allSettled(
    rows.map(({ variantId, stock }) =>
      prisma.productVariant.update({ where: { id: variantId }, data: { stock } })
    )
  )

  const succeeded = results.filter(r => r.status === "fulfilled").length
  const failedRows = rows.filter((_, i) => results[i].status === "rejected")

  logAudit({
    action: "inventory.bulk_update",
    entityType: "ProductVariant",
    entityId: "bulk",
    after: { succeeded, failed: failedRows.length, total: rows.length },
  }).catch(() => {})

  return NextResponse.json({
    succeeded,
    failed: failedRows.length,
    total: rows.length,
    failedVariantIds: failedRows.map(r => r.variantId),
  })
}
