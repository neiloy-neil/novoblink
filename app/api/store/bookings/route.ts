import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get("serviceId")
  if (!serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 })
  const service = await prisma.bookingService.findUnique({
    where: { id: serviceId, isActive: true },
    select: { id: true, name: true, price: true, durationMins: true, maxSlots: true },
  })
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 })
  return NextResponse.json(service)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const body = await req.json()

  // Check slot availability
  const existing = await prisma.booking.count({
    where: {
      serviceId: body.serviceId,
      bookingDate: new Date(body.bookingDate),
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  })
  const service = await prisma.bookingService.findUnique({
    where: { id: body.serviceId },
    select: { maxSlots: true },
  })
  if (service && existing >= service.maxSlots) {
    return NextResponse.json({ error: "This time slot is fully booked" }, { status: 409 })
  }

  const booking = await prisma.booking.create({
    data: {
      serviceId: body.serviceId,
      userId: session?.user.id || null,
      guestName: body.guestName || null,
      guestEmail: body.guestEmail || null,
      guestPhone: body.guestPhone || null,
      bookingDate: new Date(body.bookingDate),
      note: body.note || null,
    },
  })
  return NextResponse.json(booking)
}
