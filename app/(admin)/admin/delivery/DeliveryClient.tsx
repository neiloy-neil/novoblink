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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Delivery = {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  courier: string
  consignmentId: string | null
  trackingCode: string | null
  status: string
  createdAt: string
}

export function DeliveryClient({ 
  data,
  stats
}: { 
  data: Delivery[]
  stats: { totalSent: number; inTransit: number; delivered: number; failed: number }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [refreshing, setRefreshing] = useState<string | null>(null)

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/delivery?${params.toString()}`)
  }

  const handleRefreshStatus = async (orderId: string) => {
    setRefreshing(orderId)
    try {
      const res = await fetch(`/api/admin/delivery/${orderId}/refresh`, {
        method: "POST",
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert("Failed to refresh status")
      }
    } catch (err) {
      alert("Error refreshing status")
    } finally {
      setRefreshing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-green-500 text-white"
      case "FAILED": case "RETURNED": return "bg-red-500 text-white"
      case "IN_TRANSIT": return "bg-blue-500 text-white"
      default: return "bg-neutral-500 text-white"
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed/Returned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          value={searchParams.get("courier") || "all"} 
          onValueChange={(val) => handleFilterChange("courier", val || "")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Courier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Couriers</SelectItem>
            <SelectItem value="PATHAO">Pathao</SelectItem>
            <SelectItem value="STEADFAST">Steadfast</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={searchParams.get("status") || "all"} 
          onValueChange={(val) => handleFilterChange("status", val || "")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PICKED_UP">Picked Up</SelectItem>
            <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-neutral-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Courier</TableHead>
              <TableHead>Consignment ID</TableHead>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No deliveries found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium">{delivery.orderNumber}</TableCell>
                  <TableCell>{delivery.customerName}</TableCell>
                  <TableCell>
                    <Badge variant={delivery.courier === "PATHAO" ? "destructive" : "default"}>
                      {delivery.courier}
                    </Badge>
                  </TableCell>
                  <TableCell>{delivery.consignmentId || "-"}</TableCell>
                  <TableCell>{delivery.trackingCode || "-"}</TableCell>
                  <TableCell>{format(new Date(delivery.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(delivery.status)}>
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRefreshStatus(delivery.orderId)}
                      disabled={refreshing === delivery.orderId}
                    >
                      {refreshing === delivery.orderId ? "Refreshing..." : "Refresh Status"}
                    </Button>
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
