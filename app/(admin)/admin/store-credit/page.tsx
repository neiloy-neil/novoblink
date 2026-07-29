import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import StoreCreditClient from "./StoreCreditClient"

export default async function StoreCreditPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const credits = await prisma.storeCredit.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
  })
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Store Credit</h1>
        <p className="text-sm text-muted-foreground mt-1">Issue or deduct store credit for customers. Credit is applied automatically at checkout.</p>
      </div>
      <StoreCreditClient data={JSON.parse(JSON.stringify(credits))} customers={JSON.parse(JSON.stringify(customers))} />
    </div>
  )
}
