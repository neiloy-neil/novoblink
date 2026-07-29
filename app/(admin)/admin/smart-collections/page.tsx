import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SmartCollectionsPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")
  const collections = await prisma.smartCollection.findMany({ orderBy: { createdAt: "desc" } }).catch(() => [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Smart Collections</h1>
          <p className="text-sm text-muted-foreground mt-1">Rule-based product collections</p>
        </div>
        <Link href="/admin/smart-collections/new"><Button>New Collection</Button></Link>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Slug</th>
            <th className="px-4 py-2 text-left">Match</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody>
            {collections.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No collections yet</td></tr>}
            {collections.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-2 font-medium">{c.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-2 text-muted-foreground capitalize">{c.ruleMatch}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 text-xs rounded-full ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/smart-collections/${c.id}`} className="text-xs text-primary hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
