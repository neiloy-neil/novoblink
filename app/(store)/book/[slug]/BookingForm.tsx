"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CalendarCheck } from "lucide-react"

export default function BookingForm({ serviceId }: { serviceId: string }) {
  const [form, setForm] = useState({
    guestName: "", guestEmail: "", guestPhone: "",
    bookingDate: "", bookingTime: "10:00", note: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!form.guestName || !form.guestEmail || !form.bookingDate) {
      toast.error("Name, email and date are required")
      return
    }
    setSubmitting(true)
    const bookingDate = new Date(`${form.bookingDate}T${form.bookingTime}:00`)
    const res = await fetch("/api/store/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, ...form, bookingDate: bookingDate.toISOString() }),
    })
    setSubmitting(false)
    if (res.status === 409) { toast.error("This time slot is fully booked — please choose another time"); return }
    if (!res.ok) { toast.error("Failed to book — please try again"); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="text-center py-12 border rounded-xl">
        <CalendarCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Booking Confirmed!</h2>
        <p className="text-muted-foreground mt-2">We'll send a confirmation to {form.guestEmail}. See you soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 border rounded-xl p-5 bg-white">
      <h2 className="font-semibold">Book your appointment</h2>
      <div>
        <label className="text-sm font-medium">Your name *</label>
        <Input value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })} placeholder="Rahim Khan" />
      </div>
      <div>
        <label className="text-sm font-medium">Email *</label>
        <Input type="email" value={form.guestEmail} onChange={e => setForm({ ...form, guestEmail: e.target.value })} placeholder="rahim@example.com" />
      </div>
      <div>
        <label className="text-sm font-medium">Phone</label>
        <Input type="tel" value={form.guestPhone} onChange={e => setForm({ ...form, guestPhone: e.target.value })} placeholder="01700000000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Date *</label>
          <Input type="date" value={form.bookingDate} min={new Date().toISOString().split("T")[0]} onChange={e => setForm({ ...form, bookingDate: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Time</label>
          <Input type="time" value={form.bookingTime} onChange={e => setForm({ ...form, bookingTime: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Note (optional)</label>
        <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Anything we should know..." />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Booking..." : "Confirm Booking"}
      </Button>
    </div>
  )
}
