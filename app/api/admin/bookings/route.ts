import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const status = req.nextUrl.searchParams.get("status")
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : undefined,
    include: { service: { select: { name: true, price: true, durationMins: true } } },
    orderBy: { bookingDate: "asc" },
  })
  return NextResponse.json(bookings)
}
