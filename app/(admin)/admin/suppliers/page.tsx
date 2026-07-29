import prisma from "@/lib/prisma"
import { SupplierClient } from "./SupplierClient"

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchaseOrders: true } } },
  })

  const formatted = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    note: s.note,
    purchaseOrderCount: s._count.purchaseOrders,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
      </div>
      <SupplierClient data={formatted} />
    </div>
  )
}
