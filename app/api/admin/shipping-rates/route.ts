import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const zoneId = searchParams.get("zoneId")
  const rates = await prisma.shippingRate.findMany({
    where: zoneId ? { zoneId } : undefined,
    orderBy: { minWeight: "asc" },
  })
  return NextResponse.json(rates)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const rate = await prisma.shippingRate.create({
    data: {
      zoneId: data.zoneId,
      label: data.label,
      minWeight: data.minWeight ? Number(data.minWeight) : null,
      maxWeight: data.maxWeight ? Number(data.maxWeight) : null,
      minQty: data.minQty ? Number(data.minQty) : null,
      maxQty: data.maxQty ? Number(data.maxQty) : null,
      rate: Number(data.rate),
    },
  })
  return NextResponse.json(rate)
}

export async function DELETE(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await prisma.shippingRate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
