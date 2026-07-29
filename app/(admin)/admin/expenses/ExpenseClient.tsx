"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Packaging", "Delivery", "Other"]

type Expense = {
  id: string
  category: string
  amount: number
  date: string
  note: string | null
}

export function ExpenseClient({ data }: { data: Expense[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [category, setCategory] = useState("Rent")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")

  const total = data.reduce((s, e) => s + e.amount, 0)

  function openCreate() {
    setEditing(null)
    setCategory("Rent"); setAmount(""); setDate(new Date().toISOString().slice(0, 10)); setNote("")
    setIsDialogOpen(true)
  }

  function openEdit(e: Expense) {
    setEditing(e)
    setCategory(e.category); setAmount(String(e.amount)); setDate(e.date.slice(0, 10)); setNote(e.note || "")
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const url = editing ? `/api/admin/expenses/${editing.id}` : "/api/admin/expenses"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: parseFloat(amount), date, note }),
      })
      if (res.ok) {
        toast.success(editing ? "Expense updated" : "Expense added")
        setIsDialogOpen(false)
        router.refresh()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to save expense")
      }
    } catch {
      toast.error("Error saving expense")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return
    try {
      const res = await fetch(`/api/admin/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Expense deleted")
        router.refresh()
      } else {
        toast.error("Failed to delete expense")
      }
    } catch {
      toast.error("Error deleting expense")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-bold text-foreground">৳{total.toLocaleString()}</span>
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={openCreate}>Add Expense</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-neutral-700">Category</label>
                <Select value={category} onValueChange={(v) => setCategory(v || "Other")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Amount (৳)</label>
                <Input required type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Date</label>
                <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Note (optional)</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save Changes" : "Add Expense"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No expenses recorded yet.</TableCell>
              </TableRow>
            ) : (
              data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.date).toLocaleDateString("en-BD")}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell className="font-mono">৳{e.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{e.note || "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(e)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(e.id)}>Delete</Button>
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
