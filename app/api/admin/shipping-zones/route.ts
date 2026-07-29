import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const zones = await prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json(zones)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await req.json()
  const zone = await prisma.shippingZone.create({
    data: {
      name: data.name,
      districts: data.districts,
      charge: data.charge,
      freeShippingAbove: data.freeShippingAbove || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  })
  return NextResponse.json(zone)
}
