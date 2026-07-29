import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import BookingForm from "./BookingForm"

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await prisma.bookingService.findUnique({
    where: { slug, isActive: true },
  })
  if (!service) notFound()

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{service.name}</h1>
        {service.description && <p className="text-muted-foreground mt-1">{service.description}</p>}
        <div className="flex gap-4 mt-3 text-sm">
          <span className="font-bold text-lg">৳{Number(service.price).toLocaleString()}</span>
          <span className="text-muted-foreground">{service.durationMins} minutes</span>
        </div>
      </div>
      <BookingForm serviceId={service.id} />
    </div>
  )
}
