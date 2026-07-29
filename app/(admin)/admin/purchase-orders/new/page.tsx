import prisma from "@/lib/prisma"
import NewPurchaseOrderForm from "@/components/admin/NewPurchaseOrderForm"

export default async function NewPurchaseOrderPage() {
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
        <p className="text-muted-foreground text-sm mt-1">Record inventory you're buying from a supplier.</p>
      </div>
      <NewPurchaseOrderForm suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  )
}
