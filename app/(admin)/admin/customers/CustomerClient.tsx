"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Order = {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isLocked: boolean
  joinedDate: string
  totalOrders: number
  totalSpent: number
  orders: Order[]
  lastOrderAt?: string
}

export function CustomerClient({ data }: { data: Customer[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>(data)
  const [lockLoading, setLockLoading] = useState<string | null>(null)

  const toggleLock = async (customer: Customer) => {
    setLockLoading(customer.id)
    try {
      const res = await fetch("/api/admin/customers/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: customer.id, lock: !customer.isLocked }),
      })
      if (!res.ok) throw new Error("Failed")
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, isLocked: !c.isLocked } : c))
      if (selectedCustomer?.id === customer.id) setSelectedCustomer(c => c ? { ...c, isLocked: !c.isLocked } : null)
    } catch {
      alert("Failed to update lock status")
    } finally {
      setLockLoading(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm) {
      router.push(`/admin/customers?search=${encodeURIComponent(searchTerm)}`)
    } else {
      router.push(`/admin/customers`)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex max-w-sm items-center space-x-2">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined / First Order</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className={`cursor-pointer hover:bg-neutral-100 ${customer.isLocked ? "opacity-60" : ""}`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Badge variant={
                      customer.role === "ADMIN" ? "destructive" :
                      customer.role === "STAFF" ? "default" :
                      customer.role === "GUEST" ? "outline" :
                      "secondary"
                    }>
                      {customer.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(customer.joinedDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">{customer.totalOrders}</TableCell>
                  <TableCell className="text-right font-medium">
                    ৳{customer.totalSpent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant={customer.isLocked ? "outline" : "destructive"}
                      disabled={lockLoading === customer.id}
                      onClick={() => toggleLock(customer)}
                    >
                      {lockLoading === customer.id ? "..." : customer.isLocked ? "Unlock" : "Lock"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order History: {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto mt-4">
            {selectedCustomer?.orders.length === 0 ? (
              <p className="text-sm text-neutral-500">No orders found for this customer.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer?.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">৳{order.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
