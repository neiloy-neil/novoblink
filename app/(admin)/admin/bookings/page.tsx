import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import BookingsClient from "./BookingsClient"

export default async function BookingsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const [bookings, services] = await Promise.all([
    prisma.booking.findMany({
      include: { service: { select: { name: true, price: true, durationMins: true } } },
      orderBy: { bookingDate: "asc" },
    }),
    prisma.bookingService.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Bookings & Appointments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage booking services and customer appointments.</p>
      </div>
      <BookingsClient bookings={JSON.parse(JSON.stringify(bookings))} services={JSON.parse(JSON.stringify(services))} />
    </div>
  )
}
