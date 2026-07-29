import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const services = await prisma.bookingService.findMany({
    include: { _count: { select: { bookings: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const slug = body.slug || body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const service = await prisma.bookingService.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      price: Number(body.price),
      durationMins: Number(body.durationMins) || 60,
      maxSlots: Number(body.maxSlots) || 1,
      isActive: body.isActive ?? true,
      images: body.images || [],
    },
  })
  return NextResponse.json(service)
}
