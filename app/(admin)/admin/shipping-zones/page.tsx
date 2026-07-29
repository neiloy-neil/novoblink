import prisma from "@/lib/prisma"
import ShippingZoneClient from "./ShippingZoneClient"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ShippingZonesPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const zones = await prisma.shippingZone.findMany({ orderBy: { sortOrder: "asc" } })
  const data = JSON.parse(JSON.stringify(zones))
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Shipping Zones</h1>
        <p className="text-sm text-muted-foreground mt-1">Set delivery charges per zone. Zone is matched by the customer's district at checkout.</p>
      </div>
      <ShippingZoneClient data={data} />
    </div>
  )
}
