import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const locations = await prisma.location.findMany({
    include: { _count: { select: { stock: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  })
  return NextResponse.json(locations)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  if (body.isDefault) {
    await prisma.location.updateMany({ data: { isDefault: false } })
  }
  const location = await prisma.location.create({
    data: {
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      isActive: body.isActive ?? true,
      isDefault: body.isDefault || false,
    },
  })
  return NextResponse.json(location)
}
