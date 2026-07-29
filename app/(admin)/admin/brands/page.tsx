import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import BrandsClient from "./BrandsClient"

export default async function BrandsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Brands</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage product brands. Assign a brand to products for brand landing pages and filtering.</p>
      </div>
      <BrandsClient data={JSON.parse(JSON.stringify(brands))} />
    </div>
  )
}
