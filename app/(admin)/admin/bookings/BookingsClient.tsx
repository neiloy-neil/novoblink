"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Pencil, Trash2, Calendar } from "lucide-react"
import { toast } from "sonner"

type Service = { id: string; name: string; price: number; durationMins: number; isActive: boolean; _count?: { bookings: number } }
type Booking = {
  id: string; serviceId: string; guestName: string | null; guestEmail: string | null
  guestPhone: string | null; bookingDate: string; status: string; note: string | null
  adminNote: string | null; service: { name: string; price: number; durationMins: number }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
}

function ServiceForm({ editing, onSave, onClose }: { editing: Service | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: editing?.name || "", price: editing?.price?.toString() || "",
    durationMins: editing?.durationMins?.toString() || "60", isActive: editing?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name || !form.price) { toast.error("Name and price required"); return }
    setSaving(true)
    const url = editing ? `/api/admin/booking-services/${editing.id}` : "/api/admin/booking-services"
    const res = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    setSaving(false)
    if (!res.ok) { toast.error("Failed"); return }
    toast.success(editing ? "Updated" : "Created")
    onSave(); onClose()
  }

  return (
    <div className="space-y-3">
      <div><label className="text-sm font-medium">Service name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Personal Styling Session" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-sm font-medium">Price (৳)</label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
        <div><label className="text-sm font-medium">Duration (mins)</label><Input type="number" value={form.durationMins} onChange={e => setForm({ ...form, durationMins: e.target.value })} /></div>
      </div>
      <Button className="w-full" onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
    </div>
  )
}

export default function BookingsClient({ bookings: initialBookings, services: initialServices }: { bookings: Booking[]; services: Service[] }) {
  const [bookings, setBookings] = useState(initialBookings)
  const [services, setServices] = useState(initialServices)
  const [serviceDialog, setServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [newStatus, setNewStatus] = useState("")

  async function refreshData() {
    const [b, s] = await Promise.all([fetch("/api/admin/bookings").then(r => r.json()), fetch("/api/admin/booking-services").then(r => r.json())])
    setBookings(b); setServices(s)
  }

  async function deleteService(id: string) {
    if (!confirm("Delete service?")) return
    await fetch(`/api/admin/booking-services/${id}`, { method: "DELETE" })
    toast.success("Deleted"); refreshData()
  }

  async function updateBooking() {
    if (!editingBooking) return
    await fetch(`/api/admin/bookings/${editingBooking.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus || editingBooking.status, adminNote }),
    })
    toast.success("Updated"); setEditingBooking(null); refreshData()
  }

  async function deleteBooking(id: string) {
    if (!confirm("Delete booking?")) return
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" })
    toast.success("Deleted"); refreshData()
  }

  return (
    <Tabs defaultValue="bookings">
      <TabsList>
        <TabsTrigger value="bookings"><Calendar className="w-4 h-4 mr-1" />Bookings ({bookings.length})</TabsTrigger>
        <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="bookings" className="space-y-4 mt-4">
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No bookings yet.</TableCell></TableRow>}
              {bookings.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-sm font-medium">{new Date(b.bookingDate).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                  <TableCell className="text-sm">{b.service.name}<br /><span className="text-xs text-muted-foreground">{b.service.durationMins}min · ৳{Number(b.service.price).toLocaleString()}</span></TableCell>
                  <TableCell className="text-sm">{b.guestName || "—"}<br /><span className="text-xs text-muted-foreground">{b.guestEmail || ""}</span></TableCell>
                  <TableCell><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || ""}`}>{b.status}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingBooking(b); setNewStatus(b.status); setAdminNote(b.adminNote || "") }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBooking(b.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="services" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Button onClick={() => { setEditingService(null); setServiceDialog(true) }}><PlusCircle className="w-4 h-4 mr-2" />New Service</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="border rounded-xl p-4 bg-white space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{s.name}</h3>
                <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Active" : "Off"}</Badge>
              </div>
              <p className="text-xl font-bold">৳{Number(s.price).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{s.durationMins} minutes per session</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditingService(s); setServiceDialog(true) }}><Pencil className="w-3 h-3 mr-1" />Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteService(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
          {services.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No services yet.</p>}
        </div>
      </TabsContent>

      <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingService ? "Edit Service" : "Create Booking Service"}</DialogTitle></DialogHeader>
          <ServiceForm editing={editingService} onSave={refreshData} onClose={() => setServiceDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBooking} onOpenChange={v => !v && setEditingBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Booking</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <Select value={newStatus} onValueChange={v => setNewStatus(v ?? newStatus)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Admin note (optional)" value={adminNote} onChange={e => setAdminNote(e.target.value)} />
            <Button className="w-full" onClick={updateBooking}>Save changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
