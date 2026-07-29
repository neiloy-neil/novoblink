// Orphan route — real review endpoints are at /api/products/[id]/reviews
// Kept as a stub to avoid 404s from any old clients

import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 })
  return NextResponse.redirect(new URL(`/api/products/${productId}/reviews`, req.url))
}

export async function POST() {
  return NextResponse.json(
    { error: "Use POST /api/products/{productId}/reviews instead" },
    { status: 410 }
  )
}
