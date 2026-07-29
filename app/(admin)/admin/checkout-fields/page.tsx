import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import CheckoutFieldsClient from "./CheckoutFieldsClient"

export default async function CheckoutFieldsPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  const fields = await prisma.checkoutField.findMany({ orderBy: [{ step: "asc" }, { sortOrder: "asc" }] })
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Checkout Field Editor</h1>
        <p className="text-sm text-muted-foreground mt-1">Add custom fields (gift message, special instructions, etc.) to the checkout flow.</p>
      </div>
      <CheckoutFieldsClient data={JSON.parse(JSON.stringify(fields))} />
    </div>
  )
}
