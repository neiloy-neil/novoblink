import { requireAdmin } from "@/lib/auth"
import { redirect } from "next/navigation"
import ProductImportClient from "./ProductImportClient"

export default async function ProductImportPage() {
  const session = await requireAdmin()
  if (!session) redirect("/login")
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Import Products via CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a CSV file to bulk-create products and variants. Run a dry-run first to check for errors.</p>
      </div>
      <ProductImportClient />
    </div>
  )
}
