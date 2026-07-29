import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ExportClient from "./ExportClient"

export default async function ExportPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Export Data</h1>
        <p className="text-sm text-muted-foreground mt-1">Download orders, customers or products as a CSV file.</p>
      </div>
      <ExportClient />
    </div>
  )
}
