"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Supplier = {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  note: string | null
  purchaseOrderCount: number
  createdAt: string
}

export function SupplierClient({ data }: { data: Supplier[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [note, setNote] = useState("")

  function openCreate() {
    setEditing(null)
    setName(""); setPhone(""); setEmail(""); setAddress(""); setNote("")
    setIsDialogOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setName(s.name); setPhone(s.phone || ""); setEmail(s.email || ""); setAddress(s.address || ""); setNote(s.note || "")
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editing ? `/api/admin/suppliers/${editing.id}` : "/api/admin/suppliers"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, address, note }),
      })
      if (res.ok) {
        toast.success(editing ? "Supplier updated" : "Supplier added")
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save supplier")
      }
    } catch {
      toast.error("Error saving supplier")
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete supplier "${name}"?`)) return
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Supplier deleted")
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to delete supplier")
      }
    } catch {
      toast.error("Error deleting supplier")
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger render={<Button onClick={openCreate}>Add Supplier</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Textiles" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Address</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Note</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">{editing ? "Save Changes" : "Add Supplier"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Purchase Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No suppliers yet.</TableCell>
              </TableRow>
            ) : (
              data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s.email || "—"}</TableCell>
                  <TableCell>{s.purchaseOrderCount}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id, s.name)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
