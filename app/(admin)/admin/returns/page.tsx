import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ReturnsClient from "./ReturnsClient"

export default async function ReturnsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")

  const returns = await prisma.returnRequest.findMany({
    include: {
      order: { select: { orderNumber: true, shippingName: true, shippingPhone: true } },
      items: { include: { orderItem: { select: { productName: true, size: true, color: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Returns & RMA</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and approve customer return requests.</p>
      </div>
      <ReturnsClient data={JSON.parse(JSON.stringify(returns))} />
    </div>
  )
}
