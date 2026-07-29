import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const locationId = req.nextUrl.searchParams.get("locationId")
  const variantId = req.nextUrl.searchParams.get("variantId")
  const stock = await prisma.locationStock.findMany({
    where: {
      ...(locationId ? { locationId } : {}),
      ...(variantId ? { variantId } : {}),
    },
    include: {
      location: { select: { name: true } },
      variant: { select: { sku: true, size: true, color: true, product: { select: { name: true } } } },
    },
  })
  return NextResponse.json(stock)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const entry = await prisma.locationStock.upsert({
    where: { locationId_variantId: { locationId: body.locationId, variantId: body.variantId } },
    create: { locationId: body.locationId, variantId: body.variantId, stock: Number(body.stock) },
    update: { stock: Number(body.stock) },
  })
  return NextResponse.json(entry)
}
