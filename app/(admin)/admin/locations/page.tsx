import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import LocationsClient from "./LocationsClient"

export default async function LocationsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const locations = await prisma.location.findMany({
    include: { _count: { select: { stock: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Inventory Locations</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage multiple warehouse or store locations with per-location stock.</p>
      </div>
      <LocationsClient data={JSON.parse(JSON.stringify(locations))} />
    </div>
  )
}
