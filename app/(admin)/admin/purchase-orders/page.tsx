import prisma from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Plus } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  RECEIVED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
}

export default async function PurchaseOrdersPage() {
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, items: true },
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <Link href="/admin/purchase-orders/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Purchase Order</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No purchase orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-xs font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplier.name}</TableCell>
                    <TableCell>{po.items.length}</TableCell>
                    <TableCell className="font-mono">৳{Number(po.totalCost).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[po.status]}>{po.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(po.createdAt).toLocaleDateString("en-BD")}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/purchase-orders/${po.id}`}>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
